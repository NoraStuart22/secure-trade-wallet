import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedBidding, EncryptedBidding__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  organizer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedBidding")) as EncryptedBidding__factory;
  const signers: HardhatEthersSigner[] = await ethers.getSigners();
  const organizer = signers[0];
  const encryptedBiddingContract = (await factory.deploy(organizer.address)) as EncryptedBidding;
  const encryptedBiddingContractAddress = await encryptedBiddingContract.getAddress();

  return { encryptedBiddingContract, encryptedBiddingContractAddress, organizer };
}

describe("EncryptedBidding", function () {
  let signers: Signers;
  let encryptedBiddingContract: EncryptedBidding;
  let encryptedBiddingContractAddress: string;
  let organizer: HardhatEthersSigner;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      organizer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ encryptedBiddingContract, encryptedBiddingContractAddress, organizer } = await deployFixture());
  });

  it("should initialize with organizer", async function () {
    const contractOrganizer = await encryptedBiddingContract.organizer();
    expect(contractOrganizer).to.eq(organizer.address);
  });

  it("should allow alice to submit a bid", async function () {
    const clearPrice = 1000;
    const encryptedPrice = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.alice.address)
      .add32(clearPrice)
      .encrypt();

    const tx = await encryptedBiddingContract
      .connect(signers.alice)
      .submitBid(encryptedPrice.handles[0], encryptedPrice.inputProof);
    await tx.wait();

    const hasBid = await encryptedBiddingContract.hasBid(signers.alice.address);
    expect(hasBid).to.be.true;
  });

  it("should allow multiple bidders to submit bids", async function () {
    // Alice submits bid of 1000
    const alicePrice = 1000;
    const aliceEncrypted = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.alice.address)
      .add32(alicePrice)
      .encrypt();
    await (
      await encryptedBiddingContract
        .connect(signers.alice)
        .submitBid(aliceEncrypted.handles[0], aliceEncrypted.inputProof)
    ).wait();

    // Bob submits bid of 800
    const bobPrice = 800;
    const bobEncrypted = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.bob.address)
      .add32(bobPrice)
      .encrypt();
    await (
      await encryptedBiddingContract
        .connect(signers.bob)
        .submitBid(bobEncrypted.handles[0], bobEncrypted.inputProof)
    ).wait();

    // Charlie submits bid of 1200
    const charliePrice = 1200;
    const charlieEncrypted = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.charlie.address)
      .add32(charliePrice)
      .encrypt();
    await (
      await encryptedBiddingContract
        .connect(signers.charlie)
        .submitBid(charlieEncrypted.handles[0], charlieEncrypted.inputProof)
    ).wait();

    // Check all bidders have submitted
    expect(await encryptedBiddingContract.hasBid(signers.alice.address)).to.be.true;
    expect(await encryptedBiddingContract.hasBid(signers.bob.address)).to.be.true;
    expect(await encryptedBiddingContract.hasBid(signers.charlie.address)).to.be.true;
  });

  it("should retrieve encrypted bid", async function () {
    const clearPrice = 1500;
    const encryptedPrice = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.alice.address)
      .add32(clearPrice)
      .encrypt();

    await (
      await encryptedBiddingContract
        .connect(signers.alice)
        .submitBid(encryptedPrice.handles[0], encryptedPrice.inputProof)
    ).wait();

    const [encryptedBidPrice, bidderAddress, timestamp, exists] = await encryptedBiddingContract.getBid(
      signers.alice.address
    );

    expect(exists).to.be.true;
    expect(bidderAddress).to.eq(signers.alice.address);
    expect(encryptedBidPrice).to.not.eq(ethers.ZeroHash);
  });

  it("should decrypt bid for organizer", async function () {
    const clearPrice = 2000;
    const encryptedPrice = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.alice.address)
      .add32(clearPrice)
      .encrypt();

    await (
      await encryptedBiddingContract
        .connect(signers.alice)
        .submitBid(encryptedPrice.handles[0], encryptedPrice.inputProof)
    ).wait();

    const [encryptedBidPrice] = await encryptedBiddingContract.getBid(signers.alice.address);

    // Organizer can decrypt
    const decryptedPrice = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedBidPrice,
      encryptedBiddingContractAddress,
      organizer,
    );

    expect(decryptedPrice).to.eq(clearPrice);
  });

  it("should find lowest bid among multiple bids", async function () {
    // Alice submits bid of 1000
    const alicePrice = 1000;
    const aliceEncrypted = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.alice.address)
      .add32(alicePrice)
      .encrypt();
    await (
      await encryptedBiddingContract
        .connect(signers.alice)
        .submitBid(aliceEncrypted.handles[0], aliceEncrypted.inputProof)
    ).wait();

    // Bob submits bid of 800 (lowest)
    const bobPrice = 800;
    const bobEncrypted = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.bob.address)
      .add32(bobPrice)
      .encrypt();
    await (
      await encryptedBiddingContract
        .connect(signers.bob)
        .submitBid(bobEncrypted.handles[0], bobEncrypted.inputProof)
    ).wait();

    // Charlie submits bid of 1200
    const charliePrice = 1200;
    const charlieEncrypted = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.charlie.address)
      .add32(charliePrice)
      .encrypt();
    await (
      await encryptedBiddingContract
        .connect(signers.charlie)
        .submitBid(charlieEncrypted.handles[0], charlieEncrypted.inputProof)
    ).wait();

    // Find lowest bid
    const tx = await encryptedBiddingContract.findLowestBid();
    await tx.wait();

    // Get lowest bid
    const [encryptedLowest, exists] = await encryptedBiddingContract.getLowestBid();
    expect(exists).to.be.true;

    // Decrypt lowest bid (organizer can decrypt)
    const decryptedLowest = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedLowest,
      encryptedBiddingContractAddress,
      organizer,
    );

    expect(decryptedLowest).to.eq(bobPrice); // Bob's bid of 800 should be lowest
  });

  it("should allow bidder to update their bid", async function () {
    // Submit initial bid
    const initialPrice = 1500;
    const initialEncrypted = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.alice.address)
      .add32(initialPrice)
      .encrypt();
    await (
      await encryptedBiddingContract
        .connect(signers.alice)
        .submitBid(initialEncrypted.handles[0], initialEncrypted.inputProof)
    ).wait();

    // Update bid with lower price
    const updatedPrice = 1200;
    const updatedEncrypted = await fhevm
      .createEncryptedInput(encryptedBiddingContractAddress, signers.alice.address)
      .add32(updatedPrice)
      .encrypt();
    await (
      await encryptedBiddingContract
        .connect(signers.alice)
        .submitBid(updatedEncrypted.handles[0], updatedEncrypted.inputProof)
    ).wait();

    // Verify updated bid
    const [encryptedBidPrice] = await encryptedBiddingContract.getBid(signers.alice.address);
    const decryptedPrice = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedBidPrice,
      encryptedBiddingContractAddress,
      organizer,
    );

    expect(decryptedPrice).to.eq(updatedPrice);
  });
});

