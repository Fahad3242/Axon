# Axon — Cross-Chain Bridge Frontend

Axon is a modern, high-performance, and visually stunning cross-chain token bridge. It allows users to lock ERC20 tokens (`TT`) on the **Ethereum Sepolia** testnet to mint wrapped tokens (`wTT`) on **Polygon Amoy**, and burn `wTT` on Amoy to release `TT` on Sepolia.

This repository contains the Next.js 14 Web3 frontend application. It integrates RainbowKit, Wagmi, and TanStack Query for wallet connections, smart contract locks, approvals, burns, and live status polling from the relayer API.

---

## Deployed Smart Contracts

Use the following links to inspect the smart contracts deployed for the Axon Bridge on block explorers:

- **Bridge A (Ethereum Sepolia)**: [`0xd2c7926742AB4f6C6e8d64A7ad51870dDBd33cFE`](https://sepolia.etherscan.io/address/0xd2c7926742AB4f6C6e8d64A7ad51870dDBd33cFE) (Handles locking and releasing assets on Sepolia).
- **Bridge B (Polygon Amoy)**: [`0xF95A94AcbA872885E7BAb86a2B1520833Fb0C225`](https://amoy.polygonscan.com/address/0xF95A94AcbA872885E7BAb86a2B1520833Fb0C225) (Handles minting and burning wrapped assets on Amoy).
- **Mock Token TT (Ethereum Sepolia)**: [`0x10C53B4D2421BaAd9Ab32A62C0eD90b22885c9cF`](https://sepolia.etherscan.io/address/0x10C53B4D2421BaAd9Ab32A62C0eD90b22885c9cF).
- **Wrapped Token wTT (Polygon Amoy)**: [`0x5ccB67B74761f282c09e0D9f5E33e9392A111622`](https://amoy.polygonscan.com/address/0x5ccB67B74761f282c09e0D9f5E33e9392A111622).

---

## Environment Variables

Create a `.env.local` file in the root of the project. The application expects the following parameters:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SEPOLIA_RPC` | Sepolia JSON-RPC endpoint. | `https://eth-sepolia.g.alchemy.com/v2/your-key` |
| `NEXT_PUBLIC_AMOY_RPC` | Polygon Amoy JSON-RPC endpoint. | `https://polygon-amoy.g.alchemy.com/v2/your-key` |
| `NEXT_PUBLIC_BRIDGE_A_ADDRESS` | Deployed address of the Bridge A contract. | `0xd2c7926742AB4f6C6e8d64A7ad51870dDBd33cFE` |
| `NEXT_PUBLIC_BRIDGE_B_ADDRESS` | Deployed address of the Bridge B contract. | `0xF95A94AcbA872885E7BAb86a2B1520833Fb0C225` |
| `NEXT_PUBLIC_MOCK_TOKEN_ADDRESS` | Deployed address of the Sepolia MockERC20 `TT` token. | `0x10C53B4D2421BaAd9Ab32A62C0eD90b22885c9cF` |
| `NEXT_PUBLIC_WRAPPED_TOKEN_ADDRESS` | Deployed address of the Amoy Wrapped `wTT` token. | `0x5ccB67B74761f282c09e0D9f5E33e9392A111622` |
| `NEXT_PUBLIC_RELAYER_API_URL` | Base API URL of the Axon Bridge relayer. | `http://localhost:3001` |

---

## Local Setup

### 1. Install Dependencies
Ensure you have Node.js 18+ installed. Navigate to the project folder and run:
```bash
npm install
```

### 2. Configure Environment
Create `.env.local` and populate the values as described in the **Environment Variables** section.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

### 4. Build Production Bundle
To compile typescript types and output the optimized build:
```bash
npm run build
```

---

## Vercel Deployment

Deploy the frontend live to Vercel in a few simple steps:

1. **Push Code to GitHub**: Push this repository to your GitHub account.
2. **Connect to Vercel**:
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New** &rarr; **Project**.
   - Import your GitHub repository.
3. **Configure Environment Variables**:
   - Under the **Environment Variables** section, add all 7 keys listed in the *Environment Variables* table.
4. **Deploy**:
   - Click **Deploy**. Vercel will automatically detect Next.js framework settings and host your application.
