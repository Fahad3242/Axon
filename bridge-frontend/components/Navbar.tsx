'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import ConnectWallet from './ConnectWallet';
import NetworkBadge from './NetworkBadge';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Transfer', path: '/' },
    { name: 'History', path: '/history' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-[#08080F]/80 backdrop-blur-md border-b border-[#1E1E2E] px-4 md:px-8">
      <div className="relative max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Left: Logo & Wordmark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Link href="/" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#3B82F6]"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="font-monument text-white text-xl tracking-tight font-black uppercase">
              Axon
            </span>
          </Link>
        </motion.div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 h-full absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex items-center h-16 text-sm font-inter transition-colors duration-200 font-medium ${
                  isActive ? 'text-white' : 'text-[#6B7280] hover:text-white'
                }`}
              >
                <span>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Network Badge & Connect Wallet */}
        <div className="flex items-center gap-3">
          <NetworkBadge />
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
