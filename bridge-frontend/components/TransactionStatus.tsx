'use client';

import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { useTxStatus } from '@/hooks/useTxStatus';

interface TransactionStatusProps {
  srcTxHash: string;
}

export default function TransactionStatus({ srcTxHash }: TransactionStatusProps) {
  const reduceMotion = useReducedMotion();
  // Poll relayer status
  const { status, destTxHash, srcChain, error } = useTxStatus(srcTxHash);

  // Read transaction route from history to determine explorer base URLs
  let isSepoliaSource = srcChain !== 'amoy';
  if (!srcChain && typeof window !== 'undefined') {
    try {
      const existingHistory = localStorage.getItem('axon_bridge_history');
      const historyList = existingHistory ? JSON.parse(existingHistory) : [];
      const match = historyList.find((item: { sourceTx?: string; eventTxHash?: string; route?: string; srcChain?: string }) =>
        (item.sourceTx === srcTxHash || item.eventTxHash === srcTxHash)
      );
      if (match?.srcChain || match?.route) {
        isSepoliaSource = match.srcChain
          ? match.srcChain.toLowerCase() === 'sepolia'
          : match.route!.toLowerCase().startsWith('sepolia');
      }
    } catch {
      // The relayer response remains the source of truth if cached history is malformed.
    }
  }

  // Toast on relayer connection error
  useEffect(() => {
    if (error) {
      toast.error('Failed to connect to relayer API');
    }
  }, [error]);

  // Map relayer statuses to step indices
  // PENDING, CONFIRMING -> Step 1 (Confirming)
  // RELAYING -> Step 2 (Relaying)
  // COMPLETED -> Step 3 (Completed)
  // undefined (awaiting relayer recognition) -> Step 0 (Locked)
  let currentStep = 0;
  if (status === 'PENDING' || status === 'CONFIRMING') {
    currentStep = 1;
  } else if (status === 'RELAYING') {
    currentStep = 2;
  } else if (status === 'COMPLETED') {
    currentStep = 3;
  } else if (status === 'FAILED') {
    currentStep = 2; // Keep in progress for visual indicator or handle error
  }

  const steps = [
    { title: isSepoliaSource ? 'Locked' : 'Burned', desc: isSepoliaSource ? 'Locked on Sepolia' : 'Burned on Amoy' },
    { title: 'Confirming', desc: 'Awaiting block confirmations' },
    { title: 'Relaying', desc: 'Relayer submitting destination tx' },
    { title: 'Completed', desc: 'Tokens minted/released' },
  ];

  const formatHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getExplorerLink = (hash: string, isSepolia: boolean) => {
    const baseUrl = isSepolia ? 'https://sepolia.etherscan.io' : 'https://amoy.polygonscan.com';
    return (
      <a
        href={`${baseUrl}/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#3B82F6] hover:underline text-sm font-medium transition-colors"
      >
        {formatHash(hash)}
      </a>
    );
  };

  return (
    <div className="w-full font-inter">
      {/* Stepper Container */}
      <div className="flex flex-col mb-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep || status === 'COMPLETED';
          const isActive = index === currentStep && status !== 'COMPLETED' && status !== 'FAILED';
          const isPending = index > currentStep && status !== 'COMPLETED';
          const isFailedStep = status === 'FAILED' && index === currentStep;

          return (
            <div key={index} className="flex flex-col">
              <div className="flex items-center gap-3.5 py-1">
                {/* 32px circle indicator */}
                <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 border border-[#10B981]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-[#10B981]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}

                  {isActive && (
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#3B82F6] bg-[#3B82F6]/15 shadow-[0_0_16px_rgba(59,130,246,0.75)]">
                      {[0, 0.65].map((delay) => (
                        <motion.div
                          key={delay}
                          className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#3B82F6] shadow-[0_0_18px_rgba(59,130,246,0.65)]"
                          initial={{ scale: 1, opacity: 0.85 }}
                          animate={
                            reduceMotion
                              ? { scale: 1.35, opacity: 0.45 }
                              : { scale: [1, 1.45, 2.15], opacity: [0.85, 0.5, 0] }
                          }
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { duration: 1.55, delay, repeat: Infinity, ease: 'easeOut' }
                          }
                        />
                      ))}
                      <div className="w-4 h-4 rounded-full border-[3px] border-[#3B82F6]/25 border-t-[#60A5FA] border-r-[#60A5FA] animate-spin shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
                    </div>
                  )}

                  {isPending && (
                    <div className="w-8 h-8 rounded-full border border-[#1E1E2E] bg-[#0D0D16]" />
                  )}

                  {isFailedStep && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Step labels */}
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-semibold ${
                      isActive || isCompleted ? 'text-white' : 'text-[#6B7280]'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="text-xs text-[#6B7280]">{step.desc}</span>
                </div>
              </div>

              {/* Step connection line */}
              {index < steps.length - 1 && (
                <div className="w-[1px] h-6 bg-[#1E1E2E] ml-4 my-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Shortened explorer links */}
      <div className="mt-6 pt-5 border-t border-[#1E1E2E] flex flex-col gap-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#6B7280] text-xs">Source Tx</span>
          {getExplorerLink(srcTxHash, isSepoliaSource)}
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#6B7280] text-xs">Dest Tx</span>
          {destTxHash ? (
            getExplorerLink(destTxHash, !isSepoliaSource)
          ) : (
            <span className="text-[#6B7280] text-xs italic">
              {status === 'FAILED' ? 'Failed' : 'Awaiting relayer...'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
