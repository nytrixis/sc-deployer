// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Calculator {
    uint256 public result;
    
    constructor(uint256 _initialValue) {
        result = _initialValue;
    }
    
    function add(uint256 _value) public {
        result += _value;
    }
    
    function subtract(uint256 _value) public {
        result -= _value;
    }
    
    function multiply(uint256 _value) public {
        result *= _value;
    }
    
    function divide(uint256 _value) public {
        require(_value != 0, "Cannot divide by zero");
        result /= _value;
    }
    
    function getResult() public view returns (uint256) {
        return result;
    }
    
    function reset() public {
        result = 0;
    }
}
