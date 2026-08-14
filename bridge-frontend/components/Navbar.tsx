'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, History } from 'lucide-react';
import { motion } from 'framer-motion';
import ConnectWallet from './ConnectWallet';

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="AXON home">
        <span className="brand-mark"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h4l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        <span>AXON</span>
      </Link>
      <nav className="nav-tabs">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>{pathname === '/' && <motion.i layoutId="nav-pill" className="nav-pill" transition={{type:'spring',stiffness:420,damping:34}} />}<span><ArrowUpRight />Transfer</span></Link>
        <Link href="/history" className={pathname === '/history' ? 'active' : ''}>{pathname === '/history' && <motion.i layoutId="nav-pill" className="nav-pill" transition={{type:'spring',stiffness:420,damping:34}} />}<span><History />History</span></Link>
      </nav>
      <div className="nav-actions"><ConnectWallet /></div>
    </header>
  );
}
