import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BRIDGE_B_ABI, BRIDGE_B_ADDRESS } from '@/lib/contracts';

export function useBurnTokens() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: 80002,
  });

  const burn = (amount: bigint) => {
    writeContract({
      chainId: 80002,
      address: BRIDGE_B_ADDRESS,
      abi: BRIDGE_B_ABI,
      functionName: 'burnTokens',
      args: [amount],
    });
  };

  return {
    burn,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
