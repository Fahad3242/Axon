'use client';

import React from 'react';
import { useAccount } from 'wagmi';

export default function NetworkBadge() {
  const { chain, isConnected } = useAccount();

  if (!isConnected || !chain) {
    return null;
  }

  const isSepolia = chain.id === 11155111;
  const isAmoy = chain.id === 80002;
  const isSupported = isSepolia || isAmoy;

  if (!isSupported) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold uppercase font-inter tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Wrong Network
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1E1E2E] bg-[#111118] text-white text-xs font-medium font-inter">
      <span
        className={`w-2 h-2 rounded-full ${
          isSepolia ? 'bg-[#3B82F6]' : 'bg-[#A855F7]'
        }`}
      />
      <span>{chain.name}</span>
    </div>
  );
}
