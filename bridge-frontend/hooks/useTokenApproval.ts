import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ERC20_ABI, TOKEN_ADDRESS } from '@/lib/contracts';

export function useApproveToken(spender: `0x${string}`, amount: bigint) {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const approve = () => {
    if (!spender) return;
    writeContract({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return {
    approve,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
