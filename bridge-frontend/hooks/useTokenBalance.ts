import { useReadContract, useAccount } from 'wagmi';
import { ERC20_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';

export function useTokenBalance(tokenAddress: `0x${string}`, chainId: number) {
  const { address } = useAccount();

  const { data: balanceData, isLoading: isBalanceLoading, refetch } = useReadContract({
    chainId,
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  const { data: decimals, isLoading: isDecimalsLoading } = useReadContract({
    chainId,
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    },
  });

  const formattedBalance = balanceData !== undefined && decimals !== undefined
    ? parseFloat(formatUnits(balanceData, decimals)).toFixed(4)
    : '0.0000';

  const isLoading = isBalanceLoading || isDecimalsLoading;

  return {
    balance: formattedBalance,
    isLoading,
    refetch,
  };
}
