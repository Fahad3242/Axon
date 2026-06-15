'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits } from 'viem';
import { toast } from 'sonner';

import {
  TOKEN_ADDRESS,
  WRAPPED_TOKEN_ADDRESS,
  BRIDGE_A_ADDRESS,
  ERC20_ABI,
} from '@/lib/contracts';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useApproveToken } from '@/hooks/useTokenApproval';
import { useLockTokens } from '@/hooks/useBridgeA';
import { useBurnTokens } from '@/hooks/useBridgeB';
import TransactionStatus from './TransactionStatus';

export default function BridgeForm() {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  // Direction Selector: true = Sepolia -> Amoy, false = Amoy -> Sepolia
  const [isSepoliaToAmoy, setIsSepoliaToAmoy] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [srcTxHash, setSrcTxHash] = useState<string>('');

  // Fetch balances for both source tokens
  const { balance: ttBalance, refetch: refetchTT } = useTokenBalance(TOKEN_ADDRESS);
  const { balance: wttBalance, refetch: refetchWTT } = useTokenBalance(WRAPPED_TOKEN_ADDRESS);

  const currentBalanceStr = isSepoliaToAmoy ? ttBalance : wttBalance;
  const currentBalance = parseFloat(currentBalanceStr || '0');
  const fromTokenLabel = isSepoliaToAmoy ? 'TT' : 'wTT';

  const fromChainLabel = isSepoliaToAmoy ? 'Ethereum Sepolia' : 'Polygon Amoy';
  const toChainLabel = isSepoliaToAmoy ? 'Polygon Amoy' : 'Ethereum Sepolia';
  const targetChainId = isSepoliaToAmoy ? 11155111 : 80002;

  const parsedAmount = amount ? parseUnits(amount, 18) : 0n;

  // allowance check for Sepolia -> Amoy
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && BRIDGE_A_ADDRESS ? [address, BRIDGE_A_ADDRESS] : undefined,
    query: {
      enabled: !!address && isSepoliaToAmoy,
    },
  });

  // Blockchain Transaction Hooks
  const {
    approve,

    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useApproveToken(BRIDGE_A_ADDRESS, parsedAmount);

  const {
    lock,
    txHash: lockTxHash,
    isPending: isLockPending,
    isConfirming: isLockConfirming,
    isSuccess: isLockSuccess,
    error: lockError,
  } = useLockTokens();

  const {
    burn,
    txHash: burnTxHash,
    isPending: isBurnPending,
    isConfirming: isBurnConfirming,
    isSuccess: isBurnSuccess,
    error: burnError,
  } = useBurnTokens();

  // Watch for successful transaction submission to set srcTxHash
  useEffect(() => {
    if (lockTxHash) {
      setSrcTxHash(lockTxHash);
    }
  }, [lockTxHash]);

  useEffect(() => {
    if (burnTxHash) {
      setSrcTxHash(burnTxHash);
    }
  }, [burnTxHash]);

  // Display errors as Sonner toasts
  useEffect(() => {
    if (approveError) {
      toast.error(approveError.message || 'Approval transaction failed');
    }
  }, [approveError]);

  useEffect(() => {
    if (lockError) {
      toast.error(lockError.message || 'Lock & Bridge transaction failed');
    }
  }, [lockError]);

  useEffect(() => {
    if (burnError) {
      toast.error(burnError.message || 'Burn & Bridge transaction failed');
    }
  }, [burnError]);

  // Refetch data on status changes
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      toast.success('Token approved successfully!');
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isLockSuccess) {
      refetchTT();
      toast.success('Tokens successfully locked on Sepolia!');
    }
  }, [isLockSuccess, refetchTT]);

  useEffect(() => {
    if (isBurnSuccess) {
      refetchWTT();
      toast.success('Tokens successfully burned on Amoy!');
    }
  }, [isBurnSuccess, refetchWTT]);

  const handleMaxClick = () => {
    setAmount(currentBalanceStr);
  };

  const handleToggleDirection = () => {
    setIsSepoliaToAmoy(!isSepoliaToAmoy);
    setAmount('');
  };

  // Determine if approval is completed
  const isApproved =
    isApproveSuccess || (allowance !== undefined && allowance >= parsedAmount);

  const handleAction = () => {
    if (chain?.id !== targetChainId) {
      switchChain({ chainId: targetChainId });
      return;
    }

    if (isSepoliaToAmoy) {
      if (!isApproved) {
        approve();
      } else {
        lock(parsedAmount);
      }
    } else {
      burn(parsedAmount);
    }
  };

  const handleReset = () => {
    setAmount('');
    setSrcTxHash('');
  };

  const isWrongNetwork = isConnected && chain?.id !== targetChainId;

  return (
    <div className="w-full max-w-[480px] bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 transition-all duration-300">
      <AnimatePresence mode="wait">
        {!srcTxHash ? (
          <motion.div
            key="form-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            {/* Form Title & Balances Header */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-white text-sm font-semibold uppercase tracking-wider font-monument">
                Bridge Assets
              </span>
              <div className="flex flex-col text-right text-[10px] text-[#6B7280]">
                <span>TT (Sepolia): {ttBalance}</span>
                <span>wTT (Amoy): {wttBalance}</span>
              </div>
            </div>

            {/* Direction Toggle Card */}
            <div className="flex items-center justify-between bg-[#0D0D16] border border-[#1E1E2E] rounded-xl p-3.5 mb-6">
              <div className="flex flex-col">
                <span className="text-[#6B7280] text-[10px] uppercase tracking-wider">Route</span>
                <span className="text-white font-semibold text-sm mt-0.5">
                  {fromChainLabel} &rarr; {toChainLabel}
                </span>
              </div>
              <motion.button
                onClick={handleToggleDirection}
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="w-8 h-8 rounded-full bg-[#1E1E2E] flex items-center justify-center text-[#3B82F6] hover:bg-[#25253A] border border-[#1E1E2E] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l-4-4M17 20l4-4" />
                </svg>
              </motion.button>
            </div>

            {/* Amount Input */}
            <div className="flex flex-col mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[#6B7280] text-xs font-semibold uppercase tracking-wider">Amount</label>
                <button
                  onClick={handleMaxClick}
                  className="text-[#3B82F6] hover:underline text-xs font-semibold"
                >
                  MAX (Bal: {currentBalanceStr})
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 bg-[#0D0D16] border border-[#1E1E2E] rounded-xl p-4">
                <input
                  type="text"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                      setAmount(val);
                    }
                  }}
                  className="text-3xl font-light font-inter bg-transparent outline-none border-none placeholder-[#6B7280] text-white w-full"
                />
                
                {/* Token Label */}
                <div className="shrink-0 bg-[#1E1E2E] border border-[#1E1E2E] rounded-lg px-3 py-1.5 flex items-center justify-center font-bold text-sm text-white">
                  {fromTokenLabel}
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div className="flex flex-col gap-2.5 mb-6 px-1 text-sm border-t border-[#1E1E2E] pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280]">Bridge Fee</span>
                <span className="text-white font-medium">0.00 {fromTokenLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280]">Estimated Time</span>
                <span className="text-white font-medium">~2-5 minutes</span>
              </div>
            </div>

            {/* Primary Button Wrapper */}
            <motion.div whileTap={{ scale: 0.98 }}>
              {/* Not Connected State */}
              {!isConnected ? (
                <button
                  onClick={openConnectModal}
                  className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#60A5FA] text-white font-medium text-sm transition-colors duration-200"
                >
                  Connect Wallet
                </button>
              ) : isWrongNetwork ? (
                /* Wrong Network Switcher State */
                <button
                  onClick={handleAction}
                  className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#60A5FA] text-white font-medium text-sm transition-colors duration-200"
                >
                  Switch Network to {fromChainLabel}
                </button>
              ) : !amount || parseFloat(amount) <= 0 ? (
                /* Empty Input State */
                <button
                  disabled
                  className="w-full h-12 rounded-xl bg-[#1E1E2E] text-[#6B7280] border border-[#1E1E2E] font-medium text-sm cursor-not-allowed"
                >
                  Enter an amount
                </button>
              ) : parseFloat(amount) > currentBalance ? (
                /* Insufficient Balance State */
                <button
                  disabled
                  className="w-full h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-medium text-sm cursor-not-allowed"
                >
                  Insufficient Balance
                </button>
              ) : isSepoliaToAmoy && !isApproved ? (
                /* Sepolia -> Amoy Step 1: Approve TT */
                <button
                  onClick={handleAction}
                  disabled={isApprovePending || isApproveConfirming}
                  className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#60A5FA] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  {isApprovePending || isApproveConfirming ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {isApproveConfirming ? 'Confirming Approval...' : 'Approving...'}
                    </>
                  ) : (
                    `Approve ${fromTokenLabel}`
                  )}
                </button>
              ) : (
                /* Active Bridge Actions: Lock & Bridge or Burn & Bridge */
                <button
                  onClick={handleAction}
                  disabled={isLockPending || isLockConfirming || isBurnPending || isBurnConfirming}
                  className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#60A5FA] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 glow-blue-strong"
                >
                  {isLockPending || isLockConfirming || isBurnPending || isBurnConfirming ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Bridging...
                    </>
                  ) : isSepoliaToAmoy ? (
                    'Lock & Bridge'
                  ) : (
                    'Burn & Bridge'
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        ) : (
          /* Stepper Status View */
          <motion.div
            key="status-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-white text-sm font-semibold uppercase tracking-wider font-monument">
                Bridge Progress
              </span>
              <button
                onClick={handleReset}
                className="text-[#6B7280] hover:text-white text-xs transition-colors duration-200"
              >
                Reset / Back
              </button>
            </div>

            <TransactionStatus srcTxHash={srcTxHash} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
