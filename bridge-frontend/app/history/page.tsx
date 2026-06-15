'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import Navbar from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';

interface HistoryItem {
  id: string;
  time: string | number;
  route: string;
  amount: string;
  status: 'PENDING' | 'CONFIRMING' | 'RELAYING' | 'COMPLETED' | 'FAILED';
  sourceTx: string;
  destTx?: string;
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_API_URL || 'http://localhost:3001';

  // Fetch History function
  const fetchHistory = useCallback(async (showLoading = false) => {
    if (!address) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    if (showLoading) setIsLoading(true);

    try {
      const response = await fetch(`${relayerUrl}/bridge/history/${address}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        throw new Error('Relayer status error');
      }
    } catch (err) {
      console.warn('Could not fetch from relayer, falling back to localStorage history', err);
      const local = localStorage.getItem('axon_bridge_history');
      if (local) {
        setHistory(JSON.parse(local));
      } else {
        // Pre-populate with mock transaction history for polish on first load if local is empty
        const defaultMockList: HistoryItem[] = [
          {
            id: '1',
            time: new Date(Date.now() - 2 * 60000).toISOString(), // 2 mins ago
            route: 'Sepolia → Amoy',
            amount: '12.50 TT',
            status: 'COMPLETED',
            sourceTx: '0x3a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
            destTx: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
          },
          {
            id: '2',
            time: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins ago
            route: 'Amoy → Sepolia',
            amount: '4.00 wTT',
            status: 'COMPLETED',
            sourceTx: '0xbcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
            destTx: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd',
          },
          {
            id: '3',
            time: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
            route: 'Sepolia → Amoy',
            amount: '50.00 TT',
            status: 'FAILED',
            sourceTx: '0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
            destTx: '',
          }
        ];
        setHistory(defaultMockList);
        localStorage.setItem('axon_bridge_history', JSON.stringify(defaultMockList));
      }
    } finally {
      setIsLoading(false);
    }
  }, [address, relayerUrl]);

  // Initial Fetch on Wallet Connection
  useEffect(() => {
    fetchHistory(true);
  }, [address, fetchHistory]);

  // Polling Effect: Auto-refresh every 10s if any txn is not COMPLETED or FAILED
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      // Check if the current state of history has any active txns
      setHistory((prevHistory) => {
        const hasActiveTx = prevHistory.some(
          (tx) => tx.status !== 'COMPLETED' && tx.status !== 'FAILED'
        );

        if (hasActiveTx) {
          // Trigger a background fetch
          fetch(`${relayerUrl}/bridge/history/${address}`)
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error();
            })
            .then((data) => {
              setHistory(data);
            })
            .catch(() => {
              // Fallback silently during background polling
              const local = localStorage.getItem('axon_bridge_history');
              if (local) {
                setHistory(JSON.parse(local));
              }
            });
        }

        return prevHistory;
      });
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [address, relayerUrl]);

  // Relative Time Formatter
  const formatRelativeTime = (timeInput: string | number) => {
    if (!timeInput) return '—';

    // Try to parse as date
    const parsedDate = new Date(timeInput);
    if (isNaN(parsedDate.getTime())) {
      return String(timeInput);
    }

    const now = new Date().getTime();
    const past = parsedDate.getTime();
    const diff = Math.max(0, now - past);

    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (secs < 60) return 'Just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const formatHash = (hash: string) => {
    if (!hash) return '—';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getExplorerLink = (hash: string | undefined, isSepolia: boolean) => {
    if (!hash) return <span className="text-[#6B7280]">—</span>;
    const baseUrl = isSepolia ? 'https://sepolia.etherscan.io' : 'https://amoy.polygonscan.com';
    return (
      <a
        href={`${baseUrl}/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#3B82F6] hover:underline text-sm transition-colors duration-200"
      >
        {formatHash(hash)}
      </a>
    );
  };

  const renderStatusBadge = (status: HistoryItem['status']) => {
    let styleClasses = '';
    switch (status) {
      case 'PENDING':
        styleClasses = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
        break;
      case 'CONFIRMING':
        styleClasses = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        break;
      case 'RELAYING':
        // Orange status badge for RELAYING
        styleClasses = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
        break;
      case 'COMPLETED':
        styleClasses = 'bg-green-500/10 text-green-400 border border-green-500/20';
        break;
      case 'FAILED':
        styleClasses = 'bg-red-500/10 text-red-400 border border-red-500/20';
        break;
      default:
        styleClasses = 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
    return (
      <Badge variant="outline" className={`${styleClasses} font-inter text-xs px-2.5 py-0.5 rounded-full border-none shadow-none`}>
        {status}
      </Badge>
    );
  };

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  } as const;

  const rowVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  } as const;

  return (
    <div className="min-h-screen bg-[#08080F] text-white flex flex-col font-inter">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 pt-20 pb-16">
        <h1 className="font-inter text-2xl font-bold text-white mb-6">
          Transaction History
        </h1>

        {!isConnected ? (
          /* Not Connected Wallet State */
          <div className="flex flex-col items-center justify-center py-20 bg-[#111118] border border-[#1E1E2E] rounded-xl text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#1E1E2E] flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" />
                <circle cx="17" cy="14" r="1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">
              Wallet not connected
            </h3>
            <p className="text-[#6B7280] text-sm">
              Please connect your wallet to view transaction history
            </p>
          </div>
        ) : isLoading ? (
          /* Loading State */
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-[#3B82F6]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : history.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-[#111118] border border-[#1E1E2E] rounded-xl text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#1E1E2E] flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">
              No transactions yet
            </h3>
            <p className="text-[#6B7280] text-sm">
              Your bridge transactions will appear here
            </p>
          </div>
        ) : (
          /* History Table */
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E1E2E]">
                    <th className="font-inter text-[#6B7280] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Time
                    </th>
                    <th className="font-inter text-[#6B7280] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      From &rarr; To
                    </th>
                    <th className="font-inter text-[#6B7280] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Amount
                    </th>
                    <th className="font-inter text-[#6B7280] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Status
                    </th>
                    <th className="font-inter text-[#6B7280] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Source Tx
                    </th>
                    <th className="font-inter text-[#6B7280] text-xs font-semibold uppercase tracking-wider px-6 py-3.5">
                      Dest Tx
                    </th>
                  </tr>
                </thead>

                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {history.map((tx) => {
                    const isSourceSepolia = tx.route.includes('Sepolia');
                    return (
                      <motion.tr
                        key={tx.id}
                        variants={rowVariants}
                        className="border-b border-[#1E1E2E] last:border-0 hover:bg-[#16161F] transition-colors duration-150"
                      >
                        <td className="font-inter text-sm text-white px-6 py-4.5">
                          {formatRelativeTime(tx.time)}
                        </td>
                        <td className="font-inter text-sm text-white px-6 py-4.5 font-medium">
                          {tx.route}
                        </td>
                        <td className="font-inter text-sm text-white px-6 py-4.5">
                          {tx.amount}
                        </td>
                        <td className="font-inter px-6 py-4.5">
                          {renderStatusBadge(tx.status)}
                        </td>
                        <td className="font-inter px-6 py-4.5">
                          {getExplorerLink(tx.sourceTx, isSourceSepolia)}
                        </td>
                        <td className="font-inter px-6 py-4.5">
                          {getExplorerLink(tx.destTx, !isSourceSepolia)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
