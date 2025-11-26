# EncryptedBid - Privacy-Preserving Bidding System

A privacy-preserving encrypted bidding system built with FHEVM (Fully Homomorphic Encryption Virtual Machine) that allows suppliers to submit encrypted bids without revealing prices. The system can find the lowest bid using FHE operations without decrypting individual bids.

## Features

- **🔒 Encrypted Bid Submission**: Submit bid prices with FHE encryption
- **🔍 FHE Comparison**: Find the lowest bid without decrypting individual prices
- **🔐 Private Decryption**: Only the organizer can decrypt bids
- **💼 Rainbow Wallet Integration**: Seamless wallet connection using RainbowKit
- **🌐 Multi-Network Support**: Works on local Hardhat network and Sepolia testnet

## Business Use Case

**Application Scenario**: Multiple suppliers submit bids without revealing prices.

- **Create**: Submit your bid amount
- **Encrypt**: Bid price is encrypted before upload
- **FHE Operations**: Contract compares prices in encrypted state and finds the lowest bid
- **Business Value**: Prevents competitors from seeing each other's bids, ensuring fair tender process

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm** or **yarn/pnpm**: Package manager
- **Rainbow Wallet**: Browser extension installed

### Installation

1. **Install dependencies**

   ```bash
   npm install
   cd ui && npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile contracts**

   ```bash
   npm run compile
   npm run typechain
   ```

4. **Start local Hardhat node and deploy**

   ```bash
   # Option 1: Start node and deploy in one command
   .\start-and-deploy.ps1

   # Option 2: Start node separately
   .\start-hardhat-node.ps1
   # Then in another terminal:
   npx hardhat deploy --network localhost
   ```

5. **Configure frontend contract address**

   After deployment, get the contract address from `deployments/localhost/EncryptedBidding.json` and set it:

   ```bash
   cd ui
   # Create .env file
   echo "VITE_CONTRACT_ADDRESS=<contract_address>" > .env
   ```

6. **Start frontend development server**

   ```bash
   cd ui
   npm run dev
   ```

## Testing

### Local Testing

Run tests against local Hardhat network:

```bash
npm test
```

This will run `test/EncryptedBidding.ts` which tests:
- Bid submission
- Multiple bidders
- Bid retrieval
- Decryption (organizer only)
- Finding lowest bid using FHE operations
- Bid updates

### Sepolia Testnet Testing

1. Deploy to Sepolia:

   ```bash
   npx hardhat deploy --network sepolia
   ```

2. Run Sepolia tests:

   ```bash
   npm run test:sepolia
   ```

## Contract Functions

### `submitBid(externalEuint32 encryptedPrice, bytes calldata inputProof)`
Submit an encrypted bid. Bidders can update their bid by submitting again.

### `getBid(address bidder)`
Get the encrypted bid for a specific bidder address.

### `findLowestBid()`
Calculate the lowest bid among all submitted bids using FHE operations.

### `getLowestBid()`
Get the encrypted lowest bid (after `findLowestBid()` has been called).

### `getAllBidders()`
Get all addresses that have submitted bids.

### `hasBid(address bidder)`
Check if an address has submitted a bid.

## Frontend Usage

1. **Connect Wallet**: Click the "Connect Wallet" button in the top right corner
2. **Submit Bid**: Enter your bid price and click "Submit Bid"
3. **View Bids**: See all submitted bids (encrypted)
4. **Decrypt Bids** (Organizer only): Click "Decrypt" to view the actual bid price
5. **Find Lowest Bid**: Click "Find Lowest Bid" to calculate the minimum using FHE operations
6. **Decrypt Lowest Bid** (Organizer only): Decrypt the calculated lowest bid

## Project Structure

```
secure-trade-wallet/
├── contracts/
│   └── EncryptedBidding.sol      # Main contract
├── deploy/
│   └── deploy_EncryptedBidding.ts # Deployment script
├── test/
│   ├── EncryptedBidding.ts        # Local tests
│   └── EncryptedBiddingSepolia.ts # Sepolia tests
├── ui/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useBidding.tsx    # Frontend hook for contract interaction
│   │   ├── pages/
│   │   │   └── Index.tsx         # Main bidding UI
│   │   └── components/
│   │       └── Header.tsx         # Header with wallet connect
│   └── public/
│       └── logo.svg               # App logo
└── types/                         # TypeScript types (generated)
```

## Security Notes

- All bid prices are encrypted using FHE before submission
- Only the contract organizer (deployer) can decrypt bids
- The lowest bid calculation uses FHE operations, so individual prices are never revealed during comparison
- Bidders can update their bids by submitting again

## License

BSD-3-Clause-Clear

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [RainbowKit Documentation](https://rainbowkit.com/)
