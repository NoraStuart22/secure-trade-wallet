import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedBidding } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  organizer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
};

describe("EncryptedBiddingSepolia", function () {
  let signers: Signers;
  let encryptedBiddingContract: EncryptedBidding;
  let encryptedBiddingContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const EncryptedBiddingDeployment = await deployments.get("EncryptedBidding");
      encryptedBiddingContractAddress = EncryptedBiddingDeployment.address;
      encryptedBiddingContract = await ethers.getContractAt(
        "EncryptedBidding",
        EncryptedBiddingDeployment.address
      );
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { organizer: ethSigners[0], alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should submit and decrypt a bid on Sepolia", async function () {
    steps = 8;

    this.timeout(4 * 40000);

    progress("Encrypting bid price '1000'...");
    const encryptedPrice = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.alice.address)
      .add32(1000)
      .encrypt();

    progress(
      `Call submitBid() EncryptedBidding=${encryptedBiddingContractAddress} handle=${ethers.hexlify(encryptedPrice.handles[0])} signer=${signers.alice.address}...`,
    );
    let tx = await encryptedBiddingContract
      .connect(signers.alice)
      .submitBid(encryptedPrice.handles[0], encryptedPrice.inputProof);
    await tx.wait();

    progress(`Call EncryptedBidding.getBid()...`);
    const [encryptedBidPrice, bidderAddress, timestamp, exists] = await encryptedBiddingContract.getBid(
      signers.alice.address
    );
    expect(exists).to.be.true;
    expect(bidderAddress).to.eq(signers.alice.address);

    progress(`Decrypting EncryptedBidding.getBid()=${encryptedBidPrice}...`);
    const clearPrice = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedBidPrice,
      encryptedBiddingContractAddress,
      signers.organizer,
    );
    progress(`Clear EncryptedBidding.getBid()=${clearPrice}`);

    expect(clearPrice).to.eq(1000);
  });
});

