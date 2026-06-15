// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract DeployMockERC20 is Script {
    function run() external {
        vm.startBroadcast();

        MockERC20 token = new MockERC20();

        vm.stopBroadcast();

        console2.log("MockERC20 deployed at:", address(token));
    }
}
