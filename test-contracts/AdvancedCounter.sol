// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AdvancedCounter
 * @dev A more sophisticated counter with multiple features for testing compilation
 */
contract AdvancedCounter {
    uint256 public counter;
    address public owner;
    bool public paused;
    
    mapping(address => uint256) public userCounters;
    
    event CounterIncremented(uint256 newValue, address incrementer);
    event CounterDecremented(uint256 newValue, address decrementer);
    event CounterReset(address resetter);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PausedStateChanged(bool isPaused);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    constructor(uint256 _initialValue) {
        counter = _initialValue;
        owner = msg.sender;
        paused = false;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    function increment() public whenNotPaused {
        counter += 1;
        userCounters[msg.sender] += 1;
        emit CounterIncremented(counter, msg.sender);
    }
    
    function decrement() public whenNotPaused {
        require(counter > 0, "Counter cannot go below zero");
        counter -= 1;
        emit CounterDecremented(counter, msg.sender);
    }
    
    function incrementBy(uint256 _value) public whenNotPaused {
        require(_value > 0, "Value must be greater than zero");
        counter += _value;
        userCounters[msg.sender] += _value;
        emit CounterIncremented(counter, msg.sender);
    }
    
    function reset() public onlyOwner {
        counter = 0;
        emit CounterReset(msg.sender);
    }
    
    function pause() public onlyOwner {
        paused = true;
        emit PausedStateChanged(true);
    }
    
    function unpause() public onlyOwner {
        paused = false;
        emit PausedStateChanged(false);
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function getUserCounter(address user) public view returns (uint256) {
        return userCounters[user];
    }
    
    function getContractInfo() public view returns (
        uint256 currentCounter,
        address currentOwner,
        bool isPaused,
        uint256 myContributions
    ) {
        return (counter, owner, paused, userCounters[msg.sender]);
    }
}
