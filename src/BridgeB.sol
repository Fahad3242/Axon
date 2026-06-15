// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {WrappedToken} from "./WrappedToken.sol";

contract BridgeB is Ownable, ReentrancyGuard {
    WrappedToken public immutable wrappedToken;
    address public relayer;
    mapping(bytes32 => bool) public processedTxs;

    event TokenMinted(address indexed recipient, uint256 amount, bytes32 srcTxHash);
    event TokenBurned(address indexed sender, uint256 amount, bytes32 txHash);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    modifier onlyRelayer() {
        require(msg.sender == relayer, "BridgeB: caller is not relayer");
        _;
    }

    constructor(address _wrappedToken, address _relayer) Ownable(msg.sender) {
        require(_wrappedToken != address(0), "BridgeB: wrapped token is zero address");
        require(_relayer != address(0), "BridgeB: relayer is zero address");

        wrappedToken = WrappedToken(_wrappedToken);
        relayer = _relayer;
    }

    function mintTokens(address recipient, uint256 amount, bytes32 srcTxHash) external nonReentrant onlyRelayer {
        require(recipient != address(0), "BridgeB: recipient is zero address");
        require(amount > 0, "BridgeB: amount is zero");
        require(!processedTxs[srcTxHash], "BridgeB: transaction already processed");

        processedTxs[srcTxHash] = true;
        wrappedToken.mint(recipient, amount);

        emit TokenMinted(recipient, amount, srcTxHash);
    }

    function burnTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "BridgeB: amount is zero");

        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, amount, block.timestamp, block.number));

        wrappedToken.burn(msg.sender, amount);

        emit TokenBurned(msg.sender, amount, txHash);
    }

    function setRelayer(address newRelayer) external nonReentrant onlyOwner {
        require(newRelayer != address(0), "BridgeB: relayer is zero address");

        address oldRelayer = relayer;
        relayer = newRelayer;

        emit RelayerUpdated(oldRelayer, newRelayer);
    }
}
