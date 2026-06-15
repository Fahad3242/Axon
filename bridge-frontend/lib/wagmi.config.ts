import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, polygonAmoy } from 'viem/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'Axon Bridge',
  projectId: '048092a712e54f9a941b2123c5cf8c3a', // Placeholder Project ID
  chains: [sepolia, polygonAmoy],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_AMOY_RPC),
  },
  ssr: true,
});
