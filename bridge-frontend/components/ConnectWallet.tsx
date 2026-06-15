'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="h-10 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#60A5FA] text-white text-sm font-medium transition-colors duration-200"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="h-10 px-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm font-medium hover:bg-[#EF4444]/20 transition-all duration-200"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  {/* Chain Selector Button */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-xl bg-[#111118] border border-[#1E1E2E] hover:border-[#3B82F6]/50 text-white text-sm font-medium transition-all duration-200"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: '100%', height: '100%' }}
                          />
                        )}
                      </div>
                    )}
                    <span>{chain.name}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#6B7280]"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Wallet Account Details Button */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-[#111118] border border-[#1E1E2E] hover:border-[#3B82F6]/50 text-white text-sm font-medium transition-all duration-200"
                  >
                    {account.ensAvatar ? (
                      <img
                        alt={account.displayName}
                        src={account.ensAvatar}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    )}
                    <span>{account.displayName}</span>
                    {account.displayBalance ? (
                      <span className="text-[#6B7280] text-xs font-normal border-l border-[#1E1E2E] pl-2.5 ml-0.5">
                        {account.displayBalance}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
