// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {WrappedToken} from "../src/WrappedToken.sol";

contract DeployWrappedToken is Script {
    function run() external {
        vm.startBroadcast();

        WrappedToken wrappedToken = new WrappedToken();

        vm.stopBroadcast();

        console2.log("WrappedToken deployed at:", address(wrappedToken));
    }
}
