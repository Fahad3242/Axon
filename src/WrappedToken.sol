// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedToken is ERC20, Ownable {
    address public bridge;

    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);

    modifier onlyBridge() {
        require(msg.sender == bridge, "WrappedToken: caller is not bridge");
        _;
    }

    constructor() ERC20("Wrapped TT", "wTT") Ownable(msg.sender) {}

    function setBridge(address newBridge) external onlyOwner {
        require(newBridge != address(0), "WrappedToken: bridge is zero address");

        address oldBridge = bridge;
        bridge = newBridge;

        emit BridgeUpdated(oldBridge, newBridge);
    }

    function mint(address to, uint256 amount) external onlyBridge {
        require(to != address(0), "WrappedToken: to is zero address");
        require(amount > 0, "WrappedToken: amount is zero");

        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyBridge {
        require(from != address(0), "WrappedToken: from is zero address");
        require(amount > 0, "WrappedToken: amount is zero");

        _burn(from, amount);
    }
}
