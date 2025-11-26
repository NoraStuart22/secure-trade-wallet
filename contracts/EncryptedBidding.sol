// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedBidding - Encrypted Bidding System for Fair Tender
/// @notice Allows suppliers to submit encrypted bids without revealing prices
/// @dev Uses FHE to store encrypted bids and find the lowest bid without decryption
contract EncryptedBidding is SepoliaConfig {
    // Tender organizer address who can decrypt all bids
    address public organizer;
    
    // Bid structure
    struct Bid {
        euint32 encryptedPrice;  // Encrypted bid price
        address bidder;          // Address of the bidder
        uint256 timestamp;       // Submission timestamp
        bool exists;             // Whether this bid exists
    }
    
    // Mapping from bidder address to their bid
    mapping(address => Bid) private _bids;
    
    // Array to store all bidder addresses for iteration
    address[] private _bidders;
    
    // Encrypted minimum bid (lowest price found so far)
    euint32 private _lowestBid;
    address private _lowestBidder;
    bool private _lowestBidCalculated;
    // Pre-initialized zero value for view functions
    euint32 private _zeroEuint32;
    
    event BidSubmitted(
        address indexed bidder,
        uint256 timestamp
    );
    
    event LowestBidCalculated(
        address indexed lowestBidder,
        uint256 timestamp
    );
    
    /// @notice Constructor sets the tender organizer
    /// @param _organizer Address of the organizer who can decrypt bids
    constructor(address _organizer) {
        require(_organizer != address(0), "Organizer cannot be zero address");
        organizer = _organizer;
        // Initialize zero value for view functions
        _zeroEuint32 = FHE.asEuint32(0);
    }
    
    /// @notice Submit an encrypted bid
    /// @param encryptedPrice Encrypted bid price
    /// @param inputProof The FHE input proof
    function submitBid(
        externalEuint32 encryptedPrice,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted value to internal format
        euint32 price = FHE.fromExternal(encryptedPrice, inputProof);
        
        // Check if bidder already submitted a bid
        if (_bids[msg.sender].exists) {
            // Update existing bid
            _bids[msg.sender].encryptedPrice = price;
            _bids[msg.sender].timestamp = block.timestamp;
        } else {
            // Create new bid
            _bids[msg.sender] = Bid({
                encryptedPrice: price,
                bidder: msg.sender,
                timestamp: block.timestamp,
                exists: true
            });
            _bidders.push(msg.sender);
        }
        
        // Grant decryption permissions to organizer
        FHE.allowThis(_bids[msg.sender].encryptedPrice);
        FHE.allow(_bids[msg.sender].encryptedPrice, organizer);
        
        // Reset lowest bid calculation since new bid was added
        _lowestBidCalculated = false;
        
        emit BidSubmitted(msg.sender, block.timestamp);
    }
    
    /// @notice Get encrypted bid for a specific bidder
    /// @param bidder Address of the bidder
    /// @return encryptedPrice Encrypted bid price
    /// @return bidderAddress Address of the bidder
    /// @return timestamp Submission timestamp
    /// @return exists Whether the bid exists
    function getBid(address bidder)
        external
        view
        returns (
            euint32 encryptedPrice,
            address bidderAddress,
            uint256 timestamp,
            bool exists
        )
    {
        Bid memory bid = _bids[bidder];
        return (
            bid.encryptedPrice,
            bid.bidder,
            bid.timestamp,
            bid.exists
        );
    }
    
    /// @notice Find the lowest bid among all submitted bids
    /// @dev Compares encrypted prices without decryption using FHE operations
    /// Note: The actual lowest bidder address needs to be determined by decrypting all bids
    function findLowestBid() external {
        require(_bidders.length > 0, "No bids submitted");
        
        // Initialize with first bid
        _lowestBid = _bids[_bidders[0]].encryptedPrice;
        _lowestBidder = _bidders[0];
        
        // Compare with all other bids using FHE operations
        for (uint256 i = 1; i < _bidders.length; i++) {
            address bidder = _bidders[i];
            euint32 currentBid = _bids[bidder].encryptedPrice;
            
            // Use FHE comparison: FHE.lt returns an encrypted boolean (ebool)
            // FHE.select chooses between two values based on encrypted condition
            // If currentBid < _lowestBid, select currentBid, otherwise keep _lowestBid
            ebool isLess = FHE.lt(currentBid, _lowestBid);
            _lowestBid = FHE.select(isLess, currentBid, _lowestBid);
            
            // Note: _lowestBidder is set to first bidder as placeholder
            // The actual lowest bidder should be determined by decrypting all bids
        }
        
        // Grant decryption permissions to organizer for lowest bid
        FHE.allowThis(_lowestBid);
        FHE.allow(_lowestBid, organizer);
        
        _lowestBidCalculated = true;
        
        emit LowestBidCalculated(_lowestBidder, block.timestamp);
    }
    
    /// @notice Get the encrypted lowest bid
    /// @return encryptedPrice Encrypted lowest bid price
    /// @return exists Whether the lowest bid has been calculated
    function getLowestBid()
        external
        view
        returns (
            euint32 encryptedPrice,
            bool exists
        )
    {
        if (!_lowestBidCalculated) {
            return (_zeroEuint32, false);
        }
        return (_lowestBid, true);
    }
    
    /// @notice Get all bidder addresses
    /// @return Array of all bidder addresses
    function getAllBidders() external view returns (address[] memory) {
        return _bidders;
    }
    
    /// @notice Check if an address has submitted a bid
    /// @param bidder Address to check
    /// @return Whether the address has submitted a bid
    function hasBid(address bidder) external view returns (bool) {
        return _bids[bidder].exists;
    }
}

