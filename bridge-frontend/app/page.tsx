'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import BridgeForm from '@/components/BridgeForm';

export default function Page() {
  const fadeUp = {
    hidden: { y: 20, opacity: 0 },
    visible: (custom: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: custom * 0.1, duration: 0.6, ease: 'easeOut' as const }
    })
  };

  return (
    <div className="min-h-screen bg-[#151517] text-white flex flex-col font-inter">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        {/* Hero Section */}
        <section className="text-center max-w-2xl mb-8">
          {/* Pill Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#1E1E2E] bg-[#111118] text-[#6B7280] text-xs mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            Sepolia ↔ Polygon Amoy
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-editorial text-4xl md:text-5xl lg:text-6xl text-white mb-4 tracking-normal"
          >
            Bridge assets across chains
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-[#6B7280] text-lg font-light"
          >
            Fast. Secure. Trustless.
          </motion.p>
        </section>

        {/* Bridge Card Form */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="w-full flex justify-center"
        >
          <BridgeForm />
        </motion.div>
      </main>
    </div>
  );
}
