import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BRIDGE_A_ABI, BRIDGE_A_ADDRESS } from '@/lib/contracts';

export function useLockTokens() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: 11155111,
  });

  const lock = (amount: bigint) => {
    writeContract({
      chainId: 11155111,
      address: BRIDGE_A_ADDRESS,
      abi: BRIDGE_A_ABI,
      functionName: 'lockTokens',
      args: [amount],
    });
  };

  return {
    lock,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
