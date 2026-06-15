// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BridgeA} from "../src/BridgeA.sol";

contract DeployBridgeA is Script {
    function run() external {
        address token = vm.envAddress("MOCK_TOKEN_ADDRESS");
        address relayer = vm.envAddress("RELAYER_ADDRESS");

        vm.startBroadcast();

        BridgeA bridgeA = new BridgeA(token, relayer);

        vm.stopBroadcast();

        console2.log("BridgeA deployed at:", address(bridgeA));
    }
}
