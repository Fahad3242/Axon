// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BridgeB} from "../src/BridgeB.sol";
import {WrappedToken} from "../src/WrappedToken.sol";

contract DeployBridgeB is Script {
    function run() external {
        address wrappedTokenAddress = vm.envAddress("WRAPPED_TOKEN_ADDRESS");
        address relayer = vm.envAddress("RELAYER_ADDRESS");
        WrappedToken wrappedToken = WrappedToken(wrappedTokenAddress);

        vm.startBroadcast();

        BridgeB bridgeB = new BridgeB(wrappedTokenAddress, relayer);
        wrappedToken.setBridge(address(bridgeB));

        vm.stopBroadcast();

        console2.log("BridgeB deployed at:", address(bridgeB));
    }
}
