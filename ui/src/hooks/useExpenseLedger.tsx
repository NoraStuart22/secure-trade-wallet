import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";

// Contract ABI - Using minimal ABI for efficiency
// Note: externalEuint32 is compiled to bytes32 in the ABI
const ConstructionExpenseLedgerABI = [
  "function recordDailyExpense(uint256 date, bytes32 encryptedMaterialCost, bytes32 encryptedLaborCost, bytes32 encryptedRentalCost, bytes calldata inputProof) external",
  "function getDailyExpense(uint256 date) external view returns (bytes32 materialCost, bytes32 laborCost, bytes32 rentalCost, bool exists)",
  "function calculateWeeklyTotal(uint256 weekStartDate) external",
  "function getWeeklyTotal(uint256 weekStartDate) external view returns (bytes32 materialCost, bytes32 laborCost, bytes32 rentalCost, bool exists)",
  "function hasDateInitialized(uint256 date) external view returns (bool)",
  "function projectManager() external view returns (address)",
  "event ExpenseRecorded(address indexed recorder, uint256 indexed date, uint256 timestamp)",
  "event WeeklyTotalCalculated(uint256 indexed weekStart, uint256 timestamp)",
] as const;

interface UseExpenseLedgerState {
  contractAddress: string | undefined;
  isLoading: boolean;
  message: string | undefined;
  recordExpense: (date: number, materialCost: number, laborCost: number, rentalCost: number) => Promise<void>;
  getDailyExpense: (date: number) => Promise<{ materialCost: string; laborCost: string; rentalCost: string; exists: boolean } | null>;
  calculateWeeklyTotal: (weekStartDate: number) => Promise<{ materialCost: string; laborCost: string; rentalCost: string } | null>;
  decryptExpense: (encryptedValue: string) => Promise<number>;
  isProjectManager: boolean;
}

export function useExpenseLedger(contractAddress: string | undefined): UseExpenseLedgerState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);
  const [isProjectManager, setIsProjectManager] = useState(false);

  // Get EIP1193 provider
  const eip1193Provider = useCallback(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // Initialize FHEVM
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider(),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!contractAddress,
  });

  // Convert walletClient to ethers signer
  useEffect(() => {
    if (!walletClient || !chainId) {
      setEthersSigner(undefined);
      setEthersProvider(undefined);
      return;
    }

    const setupEthers = async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        setEthersProvider(provider as any);
        setEthersSigner(signer);
      } catch (error) {
        console.error("Error setting up ethers:", error);
        setEthersSigner(undefined);
        setEthersProvider(undefined);
      }
    };

    setupEthers();
  }, [walletClient, chainId]);

  // Check if user is project manager
  useEffect(() => {
    const checkProjectManager = async () => {
      if (!contractAddress || !ethersProvider || !address) {
        setIsProjectManager(false);
        return;
      }

      try {
        const contract = new ethers.Contract(contractAddress, ConstructionExpenseLedgerABI, ethersProvider);
        const manager = await contract.projectManager();
        setIsProjectManager(manager.toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error("Error checking project manager:", error);
        setIsProjectManager(false);
      }
    };

    checkProjectManager();
  }, [contractAddress, ethersProvider, address]);

  const recordExpense = useCallback(
    async (date: number, materialCost: number, laborCost: number, rentalCost: number) => {
      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      if (!ethersSigner || !fhevmInstance || !address || !ethersProvider) {
        throw new Error("Wallet not connected or FHEVM not initialized");
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting expenses...");
        console.log("[useExpenseLedger] Starting encryption...", {
          materialCost,
          laborCost,
          rentalCost,
          date,
        });

        // Encrypt all three values in the same encryption session to share the same inputProof
        // This is important - all values must use the same inputProof for the contract call
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedInput.add32(materialCost);
        encryptedInput.add32(laborCost);
        encryptedInput.add32(rentalCost);
        const encrypted = await encryptedInput.encrypt();

        console.log("[useExpenseLedger] Encryption complete", {
          hasHandles: !!encrypted.handles && encrypted.handles.length >= 3,
          hasInputProof: !!encrypted.inputProof && encrypted.inputProof.length > 0,
          handlesCount: encrypted.handles?.length || 0,
        });

        if (!encrypted.handles || encrypted.handles.length < 3) {
          throw new Error("Encryption failed - expected 3 handles but got " + (encrypted.handles?.length || 0));
        }

        setMessage("Submitting to blockchain...");

        // Verify contract is deployed
        const contractCode = await ethersProvider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode.length <= 2) {
          throw new Error(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        }

        const contract = new ethers.Contract(contractAddress, ConstructionExpenseLedgerABI, ethersSigner);

        const encryptedMaterialHandle = encrypted.handles[0];
        const encryptedLaborHandle = encrypted.handles[1];
        const encryptedRentalHandle = encrypted.handles[2];
        const inputProof = encrypted.inputProof;

        if (!encryptedMaterialHandle || !encryptedLaborHandle || !encryptedRentalHandle || !inputProof || inputProof.length === 0) {
          throw new Error("Encryption failed - missing handle or proof");
        }

        console.log("[useExpenseLedger] Submitting transaction...", {
          date,
          materialHandle: encryptedMaterialHandle,
          laborHandle: encryptedLaborHandle,
          rentalHandle: encryptedRentalHandle,
        });

        // Estimate gas first
        let gasEstimate;
        try {
          gasEstimate = await contract.recordDailyExpense.estimateGas(
            date,
            encryptedMaterialHandle,
            encryptedLaborHandle,
            encryptedRentalHandle,
            inputProof
          );
          console.log("[useExpenseLedger] Gas estimate:", gasEstimate.toString());
        } catch (estimateError: any) {
          console.error("[useExpenseLedger] Gas estimation failed:", estimateError);
          // Use a higher default if estimation fails
          gasEstimate = BigInt(10000000);
        }

        // Add 20% buffer to gas estimate
        const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

        const tx = await contract.recordDailyExpense(
          date,
          encryptedMaterialHandle,
          encryptedLaborHandle,
          encryptedRentalHandle,
          inputProof,
          { gasLimit: gasLimit.toString() }
        );

        console.log("[useExpenseLedger] Transaction sent:", tx.hash);
        setMessage("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("[useExpenseLedger] Transaction confirmed, block:", receipt.blockNumber);
        setMessage("Expense recorded successfully!");
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useExpenseLedger] Error recording expense:", error);
        throw error; // Re-throw so component can catch it
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const getDailyExpense = useCallback(
    async (date: number) => {
      if (!contractAddress || !ethersProvider) {
        return null;
      }

      try {
        const contract = new ethers.Contract(contractAddress, ConstructionExpenseLedgerABI, ethersProvider);
        const [materialCost, laborCost, rentalCost, exists] = await contract.getDailyExpense(date);
        
        return {
          materialCost: ethers.hexlify(materialCost),
          laborCost: ethers.hexlify(laborCost),
          rentalCost: ethers.hexlify(rentalCost),
          exists,
        };
      } catch (error) {
        console.error("Error getting daily expense:", error);
        return null;
      }
    },
    [contractAddress, ethersProvider]
  );

  const calculateWeeklyTotal = useCallback(
    async (weekStartDate: number) => {
      if (!contractAddress || !ethersSigner || !ethersProvider) {
        throw new Error("Wallet not connected or contract address not configured");
      }

      try {
        setIsLoading(true);
        setMessage("Calculating weekly total...");

        const contract = new ethers.Contract(contractAddress, ConstructionExpenseLedgerABI, ethersSigner);

        // Estimate gas first
        let gasEstimate;
        try {
          gasEstimate = await contract.calculateWeeklyTotal.estimateGas(weekStartDate);
          console.log("[useExpenseLedger] Gas estimate for weekly total:", gasEstimate.toString());
        } catch (estimateError: any) {
          console.error("[useExpenseLedger] Gas estimation failed:", estimateError);
          gasEstimate = BigInt(10000000);
        }

        // Add 20% buffer to gas estimate
        const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

        setMessage("Submitting transaction...");
        const tx = await contract.calculateWeeklyTotal(weekStartDate, {
          gasLimit: gasLimit.toString(),
        });

        console.log("[useExpenseLedger] Weekly total transaction sent:", tx.hash);
        setMessage("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("[useExpenseLedger] Weekly total transaction confirmed, block:", receipt.blockNumber);

        // Wait a bit for state to be updated and permissions to be set
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Read the calculated weekly total from contract using view function
        setMessage("Reading weekly total from contract...");
        // Use staticCall to read the result without sending a transaction
        const readContract = new ethers.Contract(contractAddress, ConstructionExpenseLedgerABI, ethersProvider);
        const [totalMaterial, totalLabor, totalRental, exists] = await readContract.getWeeklyTotal.staticCall(weekStartDate);
        
        if (!exists) {
          throw new Error("Weekly total calculation completed but result not found");
        }

        setMessage("Weekly total calculated successfully!");
        
        return {
          materialCost: ethers.hexlify(totalMaterial),
          laborCost: ethers.hexlify(totalLabor),
          rentalCost: ethers.hexlify(totalRental),
        };
      } catch (error: any) {
        console.error("[useExpenseLedger] Error calculating weekly total:", error);
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, ethersProvider]
  );

  const decryptExpense = useCallback(
    async (encryptedValue: string) => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        throw new Error("Missing requirements for decryption");
      }

      try {
        setMessage("Decrypting expense...");

        const handle = encryptedValue.toLowerCase();
        if (!handle || handle === "0x" || handle.length !== 66) {
          throw new Error("Invalid encrypted value format");
        }

        // Generate keypair for EIP712 signature
        const keypair = (fhevmInstance as any).generateKeypair();

        // Create EIP712 signature
        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        const eip712 = (fhevmInstance as any).createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimestamp,
          durationDays
        );

        // Sign the EIP712 message
        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        // For local network, remove "0x" prefix from signature
        const signatureForDecrypt = chainId === 31337 
          ? signature.replace("0x", "") 
          : signature;

        // Decrypt
        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          [{ handle, contractAddress: contractAddress as `0x${string}` }],
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        const decrypted = Number(decryptedResult[handle] || 0);
        setMessage("Decryption successful");
        return decrypted;
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        setMessage(`Decryption error: ${errorMessage}`);
        throw error;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId]
  );

  return {
    contractAddress,
    isLoading,
    message,
    recordExpense,
    getDailyExpense,
    calculateWeeklyTotal,
    decryptExpense,
    isProjectManager,
  };
}

