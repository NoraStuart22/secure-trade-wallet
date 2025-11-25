// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConstructionExpenseLedger - Encrypted Construction Daily Expense Ledger
/// @notice Allows recording encrypted daily construction expenses (material, labor, rental costs)
/// @dev Uses FHE to store and calculate encrypted expenses on-chain
contract ConstructionExpenseLedger is SepoliaConfig {
    // Project manager address who can decrypt expenses
    address public projectManager;
    
    // Daily expense record structure
    struct DailyExpense {
        euint32 materialCost;    // Encrypted material cost
        euint32 laborCost;       // Encrypted labor cost
        euint32 rentalCost;      // Encrypted rental cost
        uint256 timestamp;       // Date of the expense
        bool exists;             // Whether this record exists
    }
    
    // Mapping from date (timestamp / 86400) to daily expense
    mapping(uint256 => DailyExpense) private _dailyExpenses;
    
    // Mapping to track if a date has been initialized
    mapping(uint256 => bool) private _dateInitialized;
    
    // Array to store all expense dates for iteration
    uint256[] private _expenseDates;
    
    // Mapping to store calculated weekly totals
    mapping(uint256 => DailyExpense) private _weeklyTotals;
    mapping(uint256 => bool) private _weeklyTotalCalculated;
    
    event ExpenseRecorded(
        address indexed recorder,
        uint256 indexed date,
        uint256 timestamp
    );
    
    event WeeklyTotalCalculated(
        uint256 indexed weekStart,
        uint256 timestamp
    );
    
    /// @notice Constructor sets the project manager
    /// @param _projectManager Address of the project manager who can decrypt
    constructor(address _projectManager) {
        require(_projectManager != address(0), "Project manager cannot be zero address");
        projectManager = _projectManager;
    }
    
    /// @notice Record daily expenses (material, labor, rental costs)
    /// @param date Date in days since epoch (timestamp / 86400)
    /// @param encryptedMaterialCost Encrypted material cost
    /// @param encryptedLaborCost Encrypted labor cost
    /// @param encryptedRentalCost Encrypted rental cost
    /// @param inputProof The FHE input proof
    function recordDailyExpense(
        uint256 date,
        externalEuint32 encryptedMaterialCost,
        externalEuint32 encryptedLaborCost,
        externalEuint32 encryptedRentalCost,
        bytes calldata inputProof
    ) external {
        // Convert external encrypted values to internal format
        euint32 materialCost = FHE.fromExternal(encryptedMaterialCost, inputProof);
        euint32 laborCost = FHE.fromExternal(encryptedLaborCost, inputProof);
        euint32 rentalCost = FHE.fromExternal(encryptedRentalCost, inputProof);
        
        // Initialize or update daily expense
        if (!_dateInitialized[date]) {
            _dailyExpenses[date] = DailyExpense({
                materialCost: materialCost,
                laborCost: laborCost,
                rentalCost: rentalCost,
                timestamp: block.timestamp,
                exists: true
            });
            _dateInitialized[date] = true;
            _expenseDates.push(date);
        } else {
            // Add to existing expenses using FHE addition
            _dailyExpenses[date].materialCost = FHE.add(
                _dailyExpenses[date].materialCost,
                materialCost
            );
            _dailyExpenses[date].laborCost = FHE.add(
                _dailyExpenses[date].laborCost,
                laborCost
            );
            _dailyExpenses[date].rentalCost = FHE.add(
                _dailyExpenses[date].rentalCost,
                rentalCost
            );
        }
        
        // Grant decryption permissions to project manager
        FHE.allowThis(_dailyExpenses[date].materialCost);
        FHE.allow(_dailyExpenses[date].materialCost, projectManager);
        
        FHE.allowThis(_dailyExpenses[date].laborCost);
        FHE.allow(_dailyExpenses[date].laborCost, projectManager);
        
        FHE.allowThis(_dailyExpenses[date].rentalCost);
        FHE.allow(_dailyExpenses[date].rentalCost, projectManager);
        
        emit ExpenseRecorded(msg.sender, date, block.timestamp);
    }
    
    /// @notice Get encrypted daily expense for a specific date
    /// @param date Date in days since epoch
    /// @return materialCost Encrypted material cost
    /// @return laborCost Encrypted labor cost
    /// @return rentalCost Encrypted rental cost
    /// @return exists Whether the record exists
    function getDailyExpense(uint256 date) 
        external 
        view 
        returns (
            euint32 materialCost,
            euint32 laborCost,
            euint32 rentalCost,
            bool exists
        ) 
    {
        DailyExpense memory expense = _dailyExpenses[date];
        return (
            expense.materialCost,
            expense.laborCost,
            expense.rentalCost,
            expense.exists
        );
    }
    
    /// @notice Calculate and store encrypted weekly total expenses
    /// @param weekStartDate Start date of the week (in days since epoch)
    function calculateWeeklyTotal(uint256 weekStartDate) external {
        euint32 weekMaterial = FHE.asEuint32(0);
        euint32 weekLabor = FHE.asEuint32(0);
        euint32 weekRental = FHE.asEuint32(0);
        
        // Sum expenses for 7 days starting from weekStartDate
        for (uint256 i = 0; i < 7; i++) {
            uint256 date = weekStartDate + i;
            if (_dateInitialized[date]) {
                DailyExpense memory expense = _dailyExpenses[date];
                weekMaterial = FHE.add(weekMaterial, expense.materialCost);
                weekLabor = FHE.add(weekLabor, expense.laborCost);
                weekRental = FHE.add(weekRental, expense.rentalCost);
            }
        }
        
        // Store the weekly totals
        _weeklyTotals[weekStartDate] = DailyExpense({
            materialCost: weekMaterial,
            laborCost: weekLabor,
            rentalCost: weekRental,
            timestamp: block.timestamp,
            exists: true
        });
        _weeklyTotalCalculated[weekStartDate] = true;
        
        // Grant decryption permissions to project manager for weekly totals
        FHE.allowThis(weekMaterial);
        FHE.allow(weekMaterial, projectManager);
        
        FHE.allowThis(weekLabor);
        FHE.allow(weekLabor, projectManager);
        
        FHE.allowThis(weekRental);
        FHE.allow(weekRental, projectManager);
        
        emit WeeklyTotalCalculated(weekStartDate, block.timestamp);
    }
    
    /// @notice Get encrypted weekly total expenses for a specific week
    /// @param weekStartDate Start date of the week (in days since epoch)
    /// @return materialCost Encrypted total material cost for the week
    /// @return laborCost Encrypted total labor cost for the week
    /// @return rentalCost Encrypted total rental cost for the week
    /// @return exists Whether the weekly total has been calculated
    function getWeeklyTotal(uint256 weekStartDate)
        external
        view
        returns (
            euint32 materialCost,
            euint32 laborCost,
            euint32 rentalCost,
            bool exists
        )
    {
        exists = _weeklyTotalCalculated[weekStartDate];
        if (!exists) {
            // Return uninitialized values - caller should check exists flag
            DailyExpense memory empty;
            return (empty.materialCost, empty.laborCost, empty.rentalCost, false);
        }
        
        DailyExpense memory weeklyTotal = _weeklyTotals[weekStartDate];
        return (
            weeklyTotal.materialCost,
            weeklyTotal.laborCost,
            weeklyTotal.rentalCost,
            weeklyTotal.exists
        );
    }
    
    /// @notice Check if a date has been initialized
    /// @param date Date in days since epoch
    /// @return Whether the date has expenses recorded
    function hasDateInitialized(uint256 date) external view returns (bool) {
        return _dateInitialized[date];
    }
    
    /// @notice Get all expense dates
    /// @return Array of all dates with expenses
    function getAllExpenseDates() external view returns (uint256[] memory) {
        return _expenseDates;
    }
}

