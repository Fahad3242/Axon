# Axon

Cross-chain bridge prototype between Ethereum Sepolia and Polygon Amoy.

## Deployment

Load environment variables from `.env`, then run the relevant script.

Deploy the mock ERC20 token on Sepolia:

```bash
forge script script/DeployMockERC20.s.sol:DeployMockERC20 --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
```

Deploy BridgeA on Sepolia:

```bash
forge script script/DeployBridgeA.s.sol:DeployBridgeA --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
```

Deploy the wrapped token on Polygon Amoy:

```bash
forge script script/DeployWrappedToken.s.sol:DeployWrappedToken --rpc-url $AMOY_RPC_URL --broadcast --verify --etherscan-api-key $POLYGONSCAN_API_KEY
```

Deploy BridgeB on Polygon Amoy and set it as the wrapped token bridge:

```bash
forge script script/DeployBridgeB.s.sol:DeployBridgeB --rpc-url $AMOY_RPC_URL --broadcast --verify --etherscan-api-key $POLYGONSCAN_API_KEY
```
