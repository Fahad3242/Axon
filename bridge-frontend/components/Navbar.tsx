'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, History } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import axonLogo from '@/axon-symbol-cropped.png';
import ConnectWallet from './ConnectWallet';

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="AXON home">
        <span className="brand-mark brand-logo"><Image src={axonLogo} alt="" priority className="brand-logo-image" /></span>
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
