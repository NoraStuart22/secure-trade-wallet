import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";

// Contract ABI
const EncryptedBiddingABI = [
  "function submitBid(bytes32 encryptedPrice, bytes calldata inputProof) external",
  "function getBid(address bidder) external view returns (bytes32 encryptedPrice, address bidderAddress, uint256 timestamp, bool exists)",
  "function findLowestBid() external",
  "function getLowestBid() external view returns (bytes32 encryptedPrice, bool exists)",
  "function getAllBidders() external view returns (address[] memory)",
  "function hasBid(address bidder) external view returns (bool)",
  "function organizer() external view returns (address)",
  "event BidSubmitted(address indexed bidder, uint256 timestamp)",
  "event LowestBidCalculated(address indexed lowestBidder, uint256 timestamp)",
] as const;

interface UseBiddingState {
  contractAddress: string | undefined;
  isLoading: boolean;
  message: string | undefined;
  submitBid: (price: number) => Promise<void>;
  getBid: (bidderAddress: string) => Promise<{ encryptedPrice: string; bidderAddress: string; timestamp: bigint; exists: boolean } | null>;
  findLowestBid: () => Promise<void>;
  getLowestBid: () => Promise<{ encryptedPrice: string; exists: boolean } | null>;
  getAllBidders: () => Promise<string[]>;
  decryptBid: (encryptedValue: string) => Promise<number>;
  isOrganizer: boolean;
}

export function useBidding(contractAddress: string | undefined): UseBiddingState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);
  const [isOrganizer, setIsOrganizer] = useState(false);

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

  // Check if user is organizer
  useEffect(() => {
    const checkOrganizer = async () => {
      if (!contractAddress || !address) {
        setIsOrganizer(false);
        return;
      }

      if (!ethersProvider) {
        setTimeout(() => {
          checkOrganizer();
        }, 1000);
        return;
      }

      try {
        const contract = new ethers.Contract(contractAddress, EncryptedBiddingABI, ethersProvider);
        const organizer = await contract.organizer();
        const isOrg = organizer.toLowerCase() === address.toLowerCase();
        setIsOrganizer(isOrg);
      } catch (error) {
        console.error("[useBidding] Error checking organizer:", error);
        setIsOrganizer(false);
      }
    };

    checkOrganizer();
  }, [contractAddress, ethersProvider, address]);

  const submitBid = useCallback(
    async (price: number) => {
      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      if (!ethersSigner || !fhevmInstance || !address || !ethersProvider) {
        throw new Error("Wallet not connected or FHEVM not initialized");
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting bid...");
        console.log("[useBidding] Starting encryption...", { price });

        // Encrypt the bid price
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedInput.add32(price);
        const encrypted = await encryptedInput.encrypt();

        console.log("[useBidding] Encryption complete", {
          hasHandle: !!encrypted.handles && encrypted.handles.length >= 1,
          hasInputProof: !!encrypted.inputProof && encrypted.inputProof.length > 0,
        });

        if (!encrypted.handles || encrypted.handles.length < 1) {
          throw new Error("Encryption failed - expected 1 handle but got " + (encrypted.handles?.length || 0));
        }

        setMessage("Submitting to blockchain...");

        // Verify contract is deployed
        const contractCode = await ethersProvider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode.length <= 2) {
          throw new Error(`Contract not deployed at ${contractAddress}. Please deploy the contract first.`);
        }

        const contract = new ethers.Contract(contractAddress, EncryptedBiddingABI, ethersSigner);

        const encryptedPriceHandle = encrypted.handles[0];
        const inputProof = encrypted.inputProof;

        if (!encryptedPriceHandle || !inputProof || inputProof.length === 0) {
          throw new Error("Encryption failed - missing handle or proof");
        }

        console.log("[useBidding] Submitting transaction...", {
          priceHandle: encryptedPriceHandle,
        });

        // Estimate gas first
        let gasEstimate;
        try {
          gasEstimate = await contract.submitBid.estimateGas(encryptedPriceHandle, inputProof);
          console.log("[useBidding] Gas estimate:", gasEstimate.toString());
        } catch (estimateError: any) {
          console.error("[useBidding] Gas estimation failed:", estimateError);
          gasEstimate = BigInt(5000000);
        }

        // Add 20% buffer to gas estimate
        const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

        const tx = await contract.submitBid(encryptedPriceHandle, inputProof, {
          gasLimit: gasLimit.toString(),
        });

        console.log("[useBidding] Transaction sent:", tx.hash);
        setMessage("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("[useBidding] Transaction confirmed, block:", receipt.blockNumber);
        setMessage("Bid submitted successfully!");
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useBidding] Error submitting bid:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const getBid = useCallback(
    async (bidderAddress: string) => {
      if (!contractAddress || !ethersProvider) {
        return null;
      }

      try {
        const contract = new ethers.Contract(contractAddress, EncryptedBiddingABI, ethersProvider);
        const [encryptedPrice, bidderAddr, timestamp, exists] = await contract.getBid(bidderAddress);

        return {
          encryptedPrice: ethers.hexlify(encryptedPrice),
          bidderAddress: bidderAddr,
          timestamp,
          exists,
        };
      } catch (error) {
        console.error("[useBidding] Error getting bid:", error);
        return null;
      }
    },
    [contractAddress, ethersProvider]
  );

  const findLowestBid = useCallback(
    async () => {
      if (!contractAddress || !ethersSigner || !ethersProvider) {
        throw new Error("Wallet not connected or contract address not configured");
      }

      try {
        setIsLoading(true);
        setMessage("Finding lowest bid...");

        const contract = new ethers.Contract(contractAddress, EncryptedBiddingABI, ethersSigner);

        // Estimate gas first
        let gasEstimate;
        try {
          gasEstimate = await contract.findLowestBid.estimateGas();
          console.log("[useBidding] Gas estimate for findLowestBid:", gasEstimate.toString());
        } catch (estimateError: any) {
          console.error("[useBidding] Gas estimation failed:", estimateError);
          gasEstimate = BigInt(10000000);
        }

        // Add 20% buffer to gas estimate
        const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);

        setMessage("Submitting transaction...");
        const tx = await contract.findLowestBid({
          gasLimit: gasLimit.toString(),
        });

        console.log("[useBidding] Find lowest bid transaction sent:", tx.hash);
        setMessage("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("[useBidding] Transaction confirmed, block:", receipt.blockNumber);

        // Wait for state to be updated and permissions to be set
        setMessage("Waiting for state update and permissions...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        setMessage("Lowest bid calculated successfully!");
      } catch (error: any) {
        console.error("[useBidding] Error finding lowest bid:", error);
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, ethersProvider]
  );

  const getLowestBid = useCallback(
    async () => {
      if (!contractAddress || !ethersProvider) {
        return null;
      }

      try {
        const contract = new ethers.Contract(contractAddress, EncryptedBiddingABI, ethersProvider);
        const [encryptedPrice, exists] = await contract.getLowestBid();

        return {
          encryptedPrice: ethers.hexlify(encryptedPrice),
          exists,
        };
      } catch (error) {
        console.error("[useBidding] Error getting lowest bid:", error);
        return null;
      }
    },
    [contractAddress, ethersProvider]
  );

  const getAllBidders = useCallback(
    async () => {
      if (!contractAddress || !ethersProvider) {
        return [];
      }

      try {
        const contract = new ethers.Contract(contractAddress, EncryptedBiddingABI, ethersProvider);
        const bidders = await contract.getAllBidders();
        return bidders;
      } catch (error) {
        console.error("[useBidding] Error getting all bidders:", error);
        return [];
      }
    },
    [contractAddress, ethersProvider]
  );

  const decryptBid = useCallback(
    async (encryptedValue: string) => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        throw new Error("Missing requirements for decryption");
      }

      try {
        setMessage("Decrypting bid...");

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
        const signatureForDecrypt = chainId === 31337 ? signature.replace("0x", "") : signature;

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
    submitBid,
    getBid,
    findLowestBid,
    getLowestBid,
    getAllBidders,
    decryptBid,
    isOrganizer,
  };
}

