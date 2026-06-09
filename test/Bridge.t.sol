// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {BridgeA} from "../src/BridgeA.sol";
import {BridgeB} from "../src/BridgeB.sol";
import {WrappedToken} from "../src/WrappedToken.sol";

contract BridgeTest is Test {
    MockERC20 internal token;
    BridgeA internal bridgeA;
    WrappedToken internal wrappedToken;
    BridgeB internal bridgeB;

    address internal relayer;
    address internal user;
    address internal recipient;

    uint256 internal constant INITIAL_USER_BALANCE = 1_000 ether;
    uint256 internal constant BRIDGE_AMOUNT = 100 ether;
    uint256 internal constant DESTINATION_CHAIN_ID = 80002;

    event TokenLocked(
        address indexed sender,
        uint256 amount,
        uint256 destinationChainId,
        bytes32 txHash
    );
    event TokenReleased(address indexed recipient, uint256 amount, bytes32 srcTxHash);
    event TokenMinted(address indexed recipient, uint256 amount, bytes32 srcTxHash);
    event TokenBurned(address indexed sender, uint256 amount, bytes32 txHash);

    function setUp() public {
        relayer = vm.addr(1);
        user = vm.addr(2);
        recipient = vm.addr(3);

        token = new MockERC20();
        bridgeA = new BridgeA(address(token), relayer);
        wrappedToken = new WrappedToken();
        bridgeB = new BridgeB(address(wrappedToken), relayer);

        wrappedToken.setBridge(address(bridgeB));
        token.mint(user, INITIAL_USER_BALANCE);
    }

    function testLockTokens() public {
        uint256 timestamp = 1_700_000_001;
        uint256 blockNumber = 123_456;
        bytes32 expectedTxHash = _bridgeHash(user, BRIDGE_AMOUNT, timestamp, blockNumber);

        vm.prank(user);
        token.approve(address(bridgeA), BRIDGE_AMOUNT);

        vm.warp(timestamp);
        vm.roll(blockNumber);
        vm.expectEmit(true, false, false, true, address(bridgeA));
        emit TokenLocked(user, BRIDGE_AMOUNT, DESTINATION_CHAIN_ID, expectedTxHash);

        vm.prank(user);
        bridgeA.lockTokens(BRIDGE_AMOUNT);

        assertEq(token.balanceOf(address(bridgeA)), BRIDGE_AMOUNT);
        assertEq(token.balanceOf(user), INITIAL_USER_BALANCE - BRIDGE_AMOUNT);
    }

    function testMintTokens() public {
        bytes32 srcTxHash = keccak256("sepolia-lock-tx");

        vm.prank(relayer);
        bridgeB.mintTokens(recipient, BRIDGE_AMOUNT, srcTxHash);

        assertEq(wrappedToken.balanceOf(recipient), BRIDGE_AMOUNT);
        assertTrue(bridgeB.processedTxs(srcTxHash));
    }

    function testReplayAttack() public {
        bytes32 srcTxHash = keccak256("duplicate-sepolia-lock-tx");

        vm.prank(relayer);
        bridgeB.mintTokens(recipient, BRIDGE_AMOUNT, srcTxHash);

        vm.expectRevert(bytes("BridgeB: transaction already processed"));
        vm.prank(relayer);
        bridgeB.mintTokens(recipient, BRIDGE_AMOUNT, srcTxHash);
    }

    function testUnauthorizedMint() public {
        bytes32 srcTxHash = keccak256("unauthorized-sepolia-lock-tx");

        vm.expectRevert(bytes("BridgeB: caller is not relayer"));
        vm.prank(user);
        bridgeB.mintTokens(recipient, BRIDGE_AMOUNT, srcTxHash);
    }

    function testBurnTokens() public {
        bytes32 srcTxHash = keccak256("mint-before-burn");

        vm.prank(relayer);
        bridgeB.mintTokens(user, BRIDGE_AMOUNT, srcTxHash);

        uint256 timestamp = 1_700_000_002;
        uint256 blockNumber = 123_457;
        bytes32 expectedTxHash = _bridgeHash(user, BRIDGE_AMOUNT, timestamp, blockNumber);

        vm.warp(timestamp);
        vm.roll(blockNumber);
        vm.expectEmit(true, false, false, true, address(bridgeB));
        emit TokenBurned(user, BRIDGE_AMOUNT, expectedTxHash);

        vm.prank(user);
        bridgeB.burnTokens(BRIDGE_AMOUNT);

        assertEq(wrappedToken.balanceOf(user), 0);
    }

    function testReleaseTokens() public {
        bytes32 srcTxHash = keccak256("amoy-burn-tx");
        token.mint(address(bridgeA), BRIDGE_AMOUNT);

        uint256 userBalanceBefore = token.balanceOf(user);

        vm.expectEmit(true, false, false, true, address(bridgeA));
        emit TokenReleased(user, BRIDGE_AMOUNT, srcTxHash);

        vm.prank(relayer);
        bridgeA.releaseTokens(user, BRIDGE_AMOUNT, srcTxHash);

        assertEq(token.balanceOf(user), userBalanceBefore + BRIDGE_AMOUNT);
        assertTrue(bridgeA.processedTxs(srcTxHash));
    }

    function testFullLockToMintFlow() public {
        uint256 timestamp = 1_700_000_003;
        uint256 blockNumber = 123_458;
        bytes32 lockTxHash = _bridgeHash(user, BRIDGE_AMOUNT, timestamp, blockNumber);

        vm.prank(user);
        token.approve(address(bridgeA), BRIDGE_AMOUNT);

        vm.warp(timestamp);
        vm.roll(blockNumber);
        vm.expectEmit(true, false, false, true, address(bridgeA));
        emit TokenLocked(user, BRIDGE_AMOUNT, DESTINATION_CHAIN_ID, lockTxHash);

        vm.prank(user);
        bridgeA.lockTokens(BRIDGE_AMOUNT);

        vm.prank(relayer);
        bridgeB.mintTokens(user, BRIDGE_AMOUNT, lockTxHash);

        assertEq(token.balanceOf(address(bridgeA)), BRIDGE_AMOUNT);
        assertEq(wrappedToken.balanceOf(user), BRIDGE_AMOUNT);
        assertTrue(bridgeB.processedTxs(lockTxHash));
    }

    function _bridgeHash(
        address sender,
        uint256 amount,
        uint256 timestamp,
        uint256 blockNumber
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(sender, amount, timestamp, blockNumber));
    }
}
