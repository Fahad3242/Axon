'use client';

import Navbar from '@/components/Navbar';
import BridgeForm from '@/components/BridgeForm';
import { motion } from 'framer-motion';

export default function Page() {
  return (
    <div className="site-shell">
      <div className="wrap">
        <Navbar />
        <motion.main initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.45,ease:[.22,1,.36,1]}}>
          <section className="hero">
            <div className="eyebrow"><span className="sepolia">Sepolia</span><span>⇄</span><span className="amoy">Amoy</span><span>· Neural Bridge Protocol</span></div>
            <h1>Send value across chains<br /><span>like a synapse fires.</span></h1>
            <p>Fast · Secure · Trustless</p>
          </section>
          <BridgeForm />
        </motion.main>
      </div>
    </div>
  );
}
