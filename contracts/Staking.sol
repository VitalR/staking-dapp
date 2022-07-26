// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {

    struct Position {
        uint positionId;
        address walletAddress;
        uint createdDate;
        uint unlockDate;
        uint percentInterest;
        uint weiStaked;
        uint weiInterest;
        bool open;
    }

    Position position;

    uint public currentPositionId;
    mapping (uint => Position) public positions;    // id to position
    mapping (address => uint[]) public positionIdsByAddress;    // address to all their positions
    mapping (uint => uint) public tiers;    // num of days to interest rate
    uint[] public lockPeriods;  // different staking lengths

    constructor() payable {
        currentPositionId = 1;

        tiers[30] = 700;    // 30 days tier with 7% apy
        tiers[90] = 1000;   // 3 months tier with 10% apy
        tiers[180] = 12000; // 6 months tier with 12% apy

        lockPeriods.push(30);
        lockPeriods.push(90);
        lockPeriods.push(180);
    }

    function stakeEther(uint numDays) external payable {
        require(tiers[numDays] > 0, "Mapping not found");

        positions[currentPositionId] = Position(
            currentPositionId,
            msg.sender,
            block.timestamp,
            block.timestamp + (numDays * 1 days),
            tiers[numDays],
            msg.value,
            calculateInterest(tiers[numDays], msg.value),
            true
        );

        positionIdsByAddress[msg.sender].push(currentPositionId);
        currentPositionId += 1;
    }

    function calculateInterest(uint basisPoints, uint weiAmount) private pure returns (uint) {
        return (basisPoints * weiAmount) / 10000;
    }

    function modifyLockPeriods(uint numDays, uint basisPoints) external onlyOwner {
        tiers[numDays] = basisPoints;
        lockPeriods.push(numDays);
    }

    function changeUnlockDate(uint positionId, uint newUnlockDate) external onlyOwner {
        positions[positionId].unlockDate = newUnlockDate;
    }

    function getLockPeriods() external view returns (uint[] memory) {
        return lockPeriods;
    }

    function getInterestRate(uint numDays) external view returns (uint) {
        return tiers[numDays];
    }

    function getPositionById(uint positionId) external view returns (Position memory) {
        return positions[positionId];
    }

    function getPositionIdsForAddress(address walletAddress) external view returns (uint[] memory) {
        return positionIdsByAddress[walletAddress];
    }

    function closePosition(uint positionId) external {
        require(positions[positionId].walletAddress == msg.sender, "Only position creator may modify position");
        require(positions[positionId].open, "Position is closed");

        positions[positionId].open = false;

        if (block.timestamp > positions[positionId].unlockDate) {
            uint amount = positions[positionId].weiStaked + positions[positionId].weiInterest;
            (bool success, ) = payable(_msgSender()).call{value: amount}("");
            require(success, "Withdraw failed");
        } else {
            (bool success2, ) = payable(_msgSender()).call{value: positions[positionId].weiStaked}("");
            require(success2, "Withdraw failed");
        }
    }
    
}