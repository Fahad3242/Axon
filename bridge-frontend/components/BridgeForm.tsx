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

const PencilIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 9l-7 7-7-7" />
  </svg>
);

const DownArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function BridgeForm() {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  const [isSepoliaToAmoy, setIsSepoliaToAmoy] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [srcTxHash, setSrcTxHash] = useState<string>('');

  const { balance: ttBalance, refetch: refetchTT } = useTokenBalance(TOKEN_ADDRESS);
  const { balance: wttBalance, refetch: refetchWTT } = useTokenBalance(WRAPPED_TOKEN_ADDRESS);

  const currentBalanceStr = isSepoliaToAmoy ? ttBalance : wttBalance;
  const currentBalance = parseFloat(currentBalanceStr || '0');
  const fromTokenLabel = isSepoliaToAmoy ? 'TT' : 'wTT';
  const toTokenLabel = isSepoliaToAmoy ? 'wTT' : 'TT';
  const fromChainLabel = isSepoliaToAmoy ? 'Ethereum Sepolia' : 'Polygon Amoy';
  const toChainLabel = isSepoliaToAmoy ? 'Amoy' : 'Sepolia';
  const targetChainId = isSepoliaToAmoy ? 11155111 : 80002;

  const parsedAmount = amount ? parseUnits(amount, 18) : 0n;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && BRIDGE_A_ADDRESS ? [address, BRIDGE_A_ADDRESS] : undefined,
    query: { enabled: !!address && isSepoliaToAmoy },
  });

  const { approve, isPending: isApprovePending, isConfirming: isApproveConfirming, isSuccess: isApproveSuccess, error: approveError } = useApproveToken(BRIDGE_A_ADDRESS, parsedAmount);
  const { lock, txHash: lockTxHash, isPending: isLockPending, isConfirming: isLockConfirming, isSuccess: isLockSuccess, error: lockError } = useLockTokens();
  const { burn, txHash: burnTxHash, isPending: isBurnPending, isConfirming: isBurnConfirming, isSuccess: isBurnSuccess, error: burnError } = useBurnTokens();

  useEffect(() => { if (lockTxHash) setSrcTxHash(lockTxHash); }, [lockTxHash]);
  useEffect(() => { if (burnTxHash) setSrcTxHash(burnTxHash); }, [burnTxHash]);
  useEffect(() => { if (approveError) toast.error(approveError.message || 'Approval failed'); }, [approveError]);
  useEffect(() => { if (lockError) toast.error(lockError.message || 'Lock & Bridge failed'); }, [lockError]);
  useEffect(() => { if (burnError) toast.error(burnError.message || 'Burn & Bridge failed'); }, [burnError]);
  useEffect(() => { if (isApproveSuccess) { refetchAllowance(); toast.success('Token approved!'); } }, [isApproveSuccess, refetchAllowance]);
  useEffect(() => { if (isLockSuccess) { refetchTT(); toast.success('Tokens locked on Sepolia!'); } }, [isLockSuccess, refetchTT]);
  useEffect(() => { if (isBurnSuccess) { refetchWTT(); toast.success('Tokens burned on Amoy!'); } }, [isBurnSuccess, refetchWTT]);

  const handleMaxClick = () => setAmount(currentBalanceStr);
  const handleToggleDirection = () => { setIsSepoliaToAmoy(!isSepoliaToAmoy); setAmount(''); };
  const isApproved = isApproveSuccess || (allowance !== undefined && allowance >= parsedAmount);
  const isWrongNetwork = isConnected && chain?.id !== targetChainId;

  const handleAction = () => {
    if (chain?.id !== targetChainId) { switchChain({ chainId: targetChainId }); return; }
    if (isSepoliaToAmoy) {
      if (!isApproved) approve(); else lock(parsedAmount);
    } else {
      burn(parsedAmount);
    }
  };

  const handleReset = () => { setAmount(''); setSrcTxHash(''); };

  // Determine button state
  const getButtonState = () => {
    if (!isConnected) return 'connect';
    if (isWrongNetwork) return 'wrong_network';
    if (!amount || parseFloat(amount) <= 0) return 'enter_amount';
    if (parseFloat(amount) > currentBalance) return 'insufficient';
    if (isSepoliaToAmoy && !isApproved) return 'approve';
    return 'bridge';
  };

  const buttonState = getButtonState();
  const isBusy = isApprovePending || isApproveConfirming || isLockPending || isLockConfirming || isBurnPending || isBurnConfirming;

  return (
    <div className="w-full max-w-[480px]">
      <AnimatePresence mode="wait">
        {!srcTxHash ? (
          <motion.div
            key="form-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col"
          >
            {/* Floating balance header */}
            <div className="flex justify-end mb-3 px-1">
              <div className="flex flex-col text-right text-[11px] text-[#9CA3AF] leading-relaxed">
                <span>TT (Sepolia): {ttBalance}</span>
                <span>wTT (Amoy): {wttBalance}</span>
              </div>
            </div>

            {/* ── Box 1: FROM ── */}
            <div className="bg-[#1C1C1F] rounded-2xl p-5 border border-[#2A2A2E]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[#3984f0] text-xs font-semibold uppercase tracking-widest">From</span>
                <button
                  onClick={handleMaxClick}
                  className="text-[#9CA3AF] text-xs hover:text-white transition-colors"
                >
                  Balance: <span className="text-white font-medium">{currentBalanceStr} {fromTokenLabel}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Amount input */}
                <div className="flex flex-col flex-1 min-w-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) setAmount(val);
                    }}
                    className="text-[2.5rem] font-semibold bg-transparent outline-none border-none placeholder-[#3D3D42] text-white w-full p-0 leading-none"
                  />
                  <span className="text-[#6B7280] text-xs mt-1.5 flex items-center gap-1">
                    <span className="opacity-60">⇅</span>
                    ${amount ? (parseFloat(amount) * 1.0).toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* Token selector */}
                <div className="flex items-center gap-2.5 bg-[#26262A] hover:bg-[#2E2E33] border border-[#333338] rounded-xl px-3.5 py-2.5 cursor-pointer transition-colors select-none shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                    {fromTokenLabel}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-semibold text-sm leading-tight">{fromTokenLabel}</span>
                    <span className="text-[#9CA3AF] text-[10px] leading-tight">{isSepoliaToAmoy ? 'Sepolia' : 'Amoy'}</span>
                  </div>
                  <span className="text-[#6B7280] ml-0.5"><ChevronDown /></span>
                </div>
              </div>
            </div>

            {/* ── Switch arrow ── */}
            <div className="flex justify-center -my-4 z-10">
              <motion.button
                onClick={handleToggleDirection}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-9 h-9 rounded-full bg-[#26262A] border border-[#333338] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#2E2E33] shadow-lg transition-colors cursor-pointer"
              >
                <DownArrow />
              </motion.button>
            </div>

            {/* ── Box 2: TO ── */}
            <div className="bg-[#1C1C1F] rounded-2xl p-5 border border-[#2A2A2E]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#3984f0] text-xs font-semibold uppercase tracking-widest">To</span>
                  <button className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors flex items-center gap-1">
                    <PencilIcon />
                    <span className="text-xs">Set Recipient</span>
                  </button>
                </div>
                <span className="text-[#9CA3AF] text-xs">Est. Received</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Read-only output */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`text-[2.5rem] font-semibold leading-none ${amount && parseFloat(amount) > 0 ? 'text-white' : 'text-[#3D3D42]'}`}>
                    {amount && parseFloat(amount) > 0 ? parseFloat(amount).toFixed(2) : '0.00'}
                  </span>
                  <span className="text-[#6B7280] text-xs mt-1.5 flex items-center gap-1">
                    <span className="opacity-60">⇅</span>
                    ${amount ? (parseFloat(amount) * 1.0).toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* Token selector */}
                <div className="flex items-center gap-2.5 bg-[#26262A] border border-[#333338] rounded-xl px-3.5 py-2.5 select-none shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                    {toTokenLabel}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-semibold text-sm leading-tight">{toTokenLabel}</span>
                    <span className="text-[#9CA3AF] text-[10px] leading-tight">{toChainLabel}</span>
                  </div>
                  <span className="text-[#6B7280] ml-0.5"><ChevronDown /></span>
                </div>
              </div>
            </div>

            {/* ── Box 3: Branding + Action ── */}
            <div className="bg-[#1C1C1F] rounded-2xl p-5 border border-[#2A2A2E] mt-2">
              {/* Branding row */}
              <div className="flex items-center justify-center mb-4">
                <span className="text-[#3984f0] font-semibold text-sm tracking-wide">Axon Bridge</span>
              </div>

              {/* Action Button */}
              <motion.div whileTap={{ scale: 0.98 }}>
                {buttonState === 'connect' && (
                  <button
                    onClick={openConnectModal}
                    className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#5094F8] text-white font-semibold text-sm transition-all duration-200"
                  >
                    Connect Wallet
                  </button>
                )}
                {buttonState === 'wrong_network' && (
                  <button
                    onClick={handleAction}
                    className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#5094F8] text-white font-semibold text-sm transition-all duration-200"
                  >
                    Switch to {fromChainLabel}
                  </button>
                )}
                {buttonState === 'enter_amount' && (
                  <button disabled className="w-full h-12 rounded-xl bg-[#26262A] text-[#6B7280] border border-[#333338] font-semibold text-sm cursor-not-allowed">
                    Enter an amount
                  </button>
                )}
                {buttonState === 'insufficient' && (
                  <button disabled className="w-full h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm cursor-not-allowed">
                    Insufficient Balance
                  </button>
                )}
                {buttonState === 'approve' && (
                  <button
                    onClick={handleAction}
                    disabled={isBusy}
                    className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#5094F8] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBusy ? <><Spinner />{isApproveConfirming ? 'Confirming...' : 'Approving...'}</> : `Approve ${fromTokenLabel}`}
                  </button>
                )}
                {buttonState === 'bridge' && (
                  <button
                    onClick={handleAction}
                    disabled={isBusy}
                    className="w-full h-12 rounded-xl bg-[#3B82F6] hover:bg-[#5094F8] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBusy ? <><Spinner />Bridging...</> : isSepoliaToAmoy ? 'Lock & Bridge' : 'Burn & Bridge'}
                  </button>
                )}
              </motion.div>
            </div>

            {/* ── Floating fee details below ── */}
            <div className="flex flex-col gap-1.5 mt-4 px-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B7280]">Bridge Fee</span>
                <span className="text-[#9CA3AF] font-medium">0.00 TT</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B7280]">Estimated Time</span>
                <span className="text-[#9CA3AF] font-medium">~2-5 minutes</span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Transaction Status View */
          <motion.div
            key="status-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="bg-[#1C1C1F] rounded-2xl p-6 border border-[#2A2A2E]"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-white text-sm font-semibold uppercase tracking-wider">Bridge Progress</span>
              <button onClick={handleReset} className="text-[#6B7280] hover:text-white text-xs transition-colors">
                ← Back
              </button>
            </div>
            <TransactionStatus srcTxHash={srcTxHash} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
