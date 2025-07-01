// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Counter {
    uint256 private count;
    
    event Incremented(uint256 newValue);
    event Decremented(uint256 newValue);
    
    constructor(uint256 _initialValue) {
        count = _initialValue;
    }
    
    function increment() public {
        count++;
        emit Incremented(count);
    }
    
    function decrement() public {
        require(count > 0, "Counter: cannot decrement below zero");
        count--;
        emit Decremented(count);
    }
    
    function getValue() public view returns (uint256) {
        return count;
    }
    
    function reset() public {
        count = 0;
        emit Decremented(0);
    }
}
