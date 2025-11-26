# EncryptedBid - Privacy-Preserving Bidding System

A privacy-preserving encrypted bidding system built with FHEVM (Fully Homomorphic Encryption Virtual Machine) that allows suppliers to submit encrypted bids without revealing prices. The system can find the highest bid using FHE operations without decrypting individual bids, and the result is visible to everyone.

## 🌐 Live Demo

**Try it now:** [https://secure-trade-wallet.vercel.app/](https://secure-trade-wallet.vercel.app/)

## 📹 Demo Video

**Watch the demo:** [https://github.com/NoraStuart22/secure-trade-wallet/blob/main/secure-trade-wallet.mp4](https://github.com/NoraStuart22/secure-trade-wallet/blob/main/secure-trade-wallet.mp4)

## Features

- **🔒 Encrypted Bid Submission**: Submit bid prices with FHE encryption
- **🔍 FHE Comparison**: Find the highest bid without decrypting individual prices
- **👁️ Public Visibility**: All bidders can see the highest bid result
- **🔐 Private Individual Bids**: Individual bid prices remain encrypted and private
- **💼 Rainbow Wallet Integration**: Seamless wallet connection using RainbowKit
- **🌐 Multi-Network Support**: Works on local Hardhat network and Sepolia testnet

## Business Use Case

**Application Scenario**: Multiple suppliers submit bids without revealing prices.

- **Create**: Submit your bid amount
- **Encrypt**: Bid price is encrypted before upload
- **FHE Operations**: Contract compares prices in encrypted state and finds the highest bid
- **Business Value**: Prevents competitors from seeing each other's bids, ensuring fair tender process. The highest bid is revealed to everyone for transparency.

## Architecture

### Contract Design

The `EncryptedBidding` contract implements the following key functions:

#### Core Functions

1. **`submitBid(externalEuint32 encryptedPrice, bytes calldata inputProof)`**
   - Allows suppliers to submit encrypted bids
   - Each bidder can update their bid by submitting again
   - Grants decryption permission to the organizer

2. **`getBid(address bidder)`**
   - Retrieves encrypted bid for a specific bidder
   - Returns encrypted price, bidder address, timestamp, and existence flag

3. **`findHighestBid()`**
   - Uses FHE operations to compare all encrypted bids
   - Finds the highest bid without decrypting individual prices
   - Grants decryption permission to all bidders (public visibility)

4. **`getHighestBid()`**
   - Returns the encrypted highest bid
   - Can be decrypted by any bidder who submitted a bid

### Encryption & Decryption Logic

#### Frontend Encryption Flow

```typescript
// 1. Create encrypted input using FHEVM
const encryptedInput = fhevmInstance.createEncryptedInput(
  contractAddress,
  userAddress
);

// 2. Add the bid price (as euint32)
encryptedInput.add32(bidPrice);

// 3. Encrypt and get handle + proof
const encrypted = await encryptedInput.encrypt();

// 4. Submit to contract
await contract.submitBid(encrypted.handles[0], encrypted.inputProof);
```

#### Contract FHE Operations

```solidity
// Compare encrypted values using FHE.gt (greater than)
ebool isGreater = FHE.gt(currentBid, _highestBid);

// Select the greater value using FHE.select
_highestBid = FHE.select(isGreater, currentBid, _highestBid);
```

#### Frontend Decryption Flow

```typescript
// 1. Generate keypair for EIP712 signature
const keypair = fhevmInstance.generateKeypair();

// 2. Create EIP712 signature
const eip712 = fhevmInstance.createEIP712(
  keypair.publicKey,
  [contractAddress],
  startTimestamp,
  durationDays
);

// 3. Sign the EIP712 message
const signature = await signer.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message
);

// 4. Decrypt the encrypted value
const decryptedResult = await fhevmInstance.userDecrypt(
  [{ handle: encryptedValue, contractAddress }],
  keypair.privateKey,
  keypair.publicKey,
  signature,
  [contractAddress],
  userAddress,
  startTimestamp,
  durationDays
);

// 5. Extract the decrypted value
const decryptedPrice = Number(decryptedResult[encryptedValue]);
```

### Key Security Features

1. **Individual Bid Privacy**: Each bidder's price is encrypted and only visible to the organizer
2. **FHE Comparison**: Highest bid calculation happens in encrypted space without revealing individual values
3. **Public Result**: Highest bid result is visible to all bidders for transparency
4. **Permission-Based Decryption**: Uses FHEVM's permission system to control who can decrypt

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
- Decryption (organizer and bidders)
- Finding highest bid using FHE operations
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

**Encryption Process:**
- Frontend encrypts the bid price using FHEVM
- Creates encrypted input with `add32(price)`
- Generates handle and input proof
- Submits to contract

**Permissions:**
- Grants decryption permission to organizer
- Individual bids remain private

### `getBid(address bidder)`
Get the encrypted bid for a specific bidder address.

**Returns:**
- `encryptedPrice`: Encrypted bid price (euint32)
- `bidderAddress`: Address of the bidder
- `timestamp`: Submission timestamp
- `exists`: Whether the bid exists

### `findHighestBid()`
Calculate the highest bid among all submitted bids using FHE operations.

**FHE Operations:**
```solidity
// Compare each bid with current highest
ebool isGreater = FHE.gt(currentBid, _highestBid);
_highestBid = FHE.select(isGreater, currentBid, _highestBid);
```

**Permissions:**
- Grants decryption permission to organizer
- Grants decryption permission to all bidders (public visibility)

### `getHighestBid()`
Get the encrypted highest bid (after `findHighestBid()` has been called).

**Returns:**
- `encryptedPrice`: Encrypted highest bid price (euint32)
- `exists`: Whether the highest bid has been calculated

**Decryption:**
- All bidders can decrypt the highest bid
- Organizer can also decrypt

### `getAllBidders()`
Get all addresses that have submitted bids.

### `hasBid(address bidder)`
Check if an address has submitted a bid.

## Frontend Usage

1. **Connect Wallet**: Click the "Connect Wallet" button in the top right corner
2. **Submit Bid**: Enter your bid price and click "Submit Bid"
   - Your bid will be encrypted before submission
   - Only the organizer can see individual bid prices
3. **View Bids**: See all submitted bids (encrypted)
4. **Find Highest Bid**: Click "Find Highest Bid" to calculate the maximum using FHE operations
5. **View Highest Bid**: The highest bid is automatically decrypted and displayed to everyone

## Project Structure

```
secure-trade-wallet/
├── contracts/
│   └── EncryptedBidding.sol      # Main contract with FHE operations
├── deploy/
│   └── deploy_EncryptedBidding.ts # Deployment script
├── test/
│   ├── EncryptedBidding.ts        # Local tests
│   └── EncryptedBiddingSepolia.ts # Sepolia tests
├── ui/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useBidding.tsx     # Frontend hook for contract interaction
│   │   ├── fhevm/
│   │   │   ├── useFhevm.tsx      # FHEVM instance management
│   │   │   └── internal/
│   │   │       ├── fhevm.ts      # FHEVM creation logic
│   │   │       └── mock/
│   │   │           └── fhevmMock.ts # Mock FHEVM for local development
│   │   ├── pages/
│   │   │   └── Index.tsx         # Main bidding UI
│   │   └── components/
│   │       └── Header.tsx        # Header with wallet connect
│   └── public/
│       └── logo.svg               # App logo
└── types/                         # TypeScript types (generated)
```

## Technical Details

### FHE Operations

The contract uses Fully Homomorphic Encryption to perform comparisons without decryption:

1. **Encryption**: Bid prices are encrypted as `euint32` (encrypted uint32)
2. **Comparison**: Uses `FHE.gt()` to compare encrypted values
3. **Selection**: Uses `FHE.select()` to choose the greater value
4. **Result**: Highest bid is stored encrypted and can be decrypted by authorized users

### Permission System

FHEVM uses a permission-based decryption system:

- **Organizer**: Can decrypt all individual bids
- **Bidders**: Can decrypt their own bids and the highest bid result
- **Public**: Highest bid result is visible to all bidders

### Network Support

- **Localhost (31337)**: Uses mock FHEVM for development
- **Sepolia Testnet**: Uses real FHEVM relayer

## Security Notes

- All bid prices are encrypted using FHE before submission
- Individual bids are only visible to the organizer
- Highest bid calculation uses FHE operations, so individual prices are never revealed during comparison
- Highest bid result is public (all bidders can see it)
- Bidders can update their bids by submitting again
- Contract uses FHEVM's permission system for access control

## Deployment

### Local Deployment

```bash
# Start Hardhat node
npx hardhat node

# Deploy contract
npx hardhat deploy --network localhost

# Update .env file with contract address
echo "VITE_CONTRACT_ADDRESS=<deployed_address>" > ui/.env
```

### Vercel Deployment

The project is configured for automatic deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set build command: `cd ui && npm run build`
3. Set output directory: `ui/dist`
4. Add environment variable: `VITE_CONTRACT_ADDRESS` (for production)

## License

BSD-3-Clause-Clear

## Resources

- [Live Demo](https://secure-trade-wallet.vercel.app/)
- [Demo Video](https://github.com/NoraStuart22/secure-trade-wallet/blob/main/secure-trade-wallet.mp4)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [RainbowKit Documentation](https://rainbowkit.com/)
- [GitHub Repository](https://github.com/NoraStuart22/secure-trade-wallet)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/NoraStuart22/secure-trade-wallet/issues).
