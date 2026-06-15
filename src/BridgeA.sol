// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BridgeA is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant DESTINATION_CHAIN_ID = 80002;

    IERC20 public immutable token;
    address public relayer;
    mapping(bytes32 => bool) public processedTxs;

    event TokenLocked(address indexed sender, uint256 amount, uint256 destinationChainId, bytes32 txHash);
    event TokenReleased(address indexed recipient, uint256 amount, bytes32 srcTxHash);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    modifier onlyRelayer() {
        require(msg.sender == relayer, "BridgeA: caller is not relayer");
        _;
    }

    constructor(address _token, address _relayer) Ownable(msg.sender) {
        require(_token != address(0), "BridgeA: token is zero address");
        require(_relayer != address(0), "BridgeA: relayer is zero address");

        token = IERC20(_token);
        relayer = _relayer;
    }

    function lockTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "BridgeA: amount is zero");

        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, amount, block.timestamp, block.number));

        token.safeTransferFrom(msg.sender, address(this), amount);

        emit TokenLocked(msg.sender, amount, DESTINATION_CHAIN_ID, txHash);
    }

    function releaseTokens(address recipient, uint256 amount, bytes32 srcTxHash) external nonReentrant onlyRelayer {
        require(recipient != address(0), "BridgeA: recipient is zero address");
        require(amount > 0, "BridgeA: amount is zero");
        require(!processedTxs[srcTxHash], "BridgeA: transaction already processed");

        processedTxs[srcTxHash] = true;
        token.safeTransfer(recipient, amount);

        emit TokenReleased(recipient, amount, srcTxHash);
    }

    function setRelayer(address newRelayer) external nonReentrant onlyOwner {
        require(newRelayer != address(0), "BridgeA: relayer is zero address");

        address oldRelayer = relayer;
        relayer = newRelayer;

        emit RelayerUpdated(oldRelayer, newRelayer);
    }
}
