import { useQuery } from '@tanstack/react-query';

interface TxStatusResponse {
  status: 'PENDING' | 'CONFIRMING' | 'RELAYING' | 'COMPLETED' | 'FAILED';
  destTxHash?: string;
  srcChain?: 'sepolia' | 'amoy';
}

export function useTxStatus(srcTxHash: string) {
  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_API_URL || 'http://localhost:3001';

  const { data, isLoading, error } = useQuery<TxStatusResponse>({
    queryKey: ['txStatus', srcTxHash],
    queryFn: async () => {
      const response = await fetch(`${relayerUrl}/bridge/tx/${srcTxHash}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tx status');
      }
      return response.json();
    },
    enabled: !!srcTxHash,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
  });

  return {
    status: data?.status,
    destTxHash: data?.destTxHash,
    srcChain: data?.srcChain,
    isLoading,
    error,
  };
}
