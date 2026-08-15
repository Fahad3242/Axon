import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ERC20_ABI, TOKEN_ADDRESS } from '@/lib/contracts';

export function useApproveToken(spender: `0x${string}`, amount: bigint) {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: 11155111,
  });

  const approve = () => {
    if (!spender) return;
    writeContract({
      chainId: 11155111,
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
