'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBalance } from 'wagmi';
import type { Address } from 'viem';

function ChainMark({chainId}:{chainId:number}){
  const polygon=chainId===80002;
  return <span className={`chain-mark ${polygon?'polygon-mark':'ethereum-mark'}`} aria-hidden="true">{polygon?<svg viewBox="0 0 24 24" fill="none"><path d="M7.2 9.3 10 7.7a2.5 2.5 0 0 1 2.5 0l2 1.2a1.3 1.3 0 0 0 1.3 0l2.1-1.2a1.3 1.3 0 0 1 1.9 1.1v2.4c0 .5-.3.9-.7 1.1l-3.3 1.9a2.5 2.5 0 0 1-2.5 0l-2-1.2a1.3 1.3 0 0 0-1.3 0l-2.1 1.2A1.3 1.3 0 0 1 6 13.1v-2.6c0-.5.3-.9.7-1.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>:<svg viewBox="0 0 24 24"><path d="m12 2.8-5.3 9 5.3 3.1 5.3-3.1L12 2.8Z" fill="currentColor"/><path d="m6.7 12.8 5.3 8.4 5.3-8.4-5.3 3.1-5.3-3.1Z" fill="currentColor" opacity=".72"/></svg>}</span>;
}

function ConnectedControls({address,name,chainId,chainName,openAccount,openChain}:{address:Address;name:string;chainId:number;chainName:string;openAccount:()=>void;openChain:()=>void}){
  const {data:balance}=useBalance({address,chainId});
  const fallbackSymbol=chainId===80002?'POL':'ETH';
  const displayBalance=balance?`${Number(balance.formatted).toLocaleString(undefined,{maximumFractionDigits:3})} ${balance.symbol}`:`0 ${fallbackSymbol}`;
  const label=chainId===80002?'Polygon Amoy':chainId===11155111?'Sepolia':chainName;
  return <>
    <motion.button whileHover={{y:-1}} whileTap={{scale:.98}} onClick={openChain} className="chain-button" type="button"><ChainMark chainId={chainId}/><span>{label}</span><ChevronDown/></motion.button>
    <motion.button whileHover={{y:-1}} whileTap={{scale:.98}} onClick={openAccount} className="wallet-button account-button" type="button"><i/><span>{name}</span><em/><small>{displayBalance}</small></motion.button>
  </>;
}

export default function ConnectWallet(){return <ConnectButton.Custom>{({account,chain,openAccountModal,openChainModal,openConnectModal,mounted})=>{
  const connected=mounted&&account&&chain;
  if(!connected)return <motion.button whileHover={{y:-1}} whileTap={{scale:.97}} onClick={openConnectModal} className="wallet-button connect">Connect wallet</motion.button>;
  if(chain.unsupported)return <button onClick={openChainModal} className="wallet-button wrong">Wrong network</button>;
  return <ConnectedControls address={account.address as Address} name={account.displayName} chainId={chain.id} chainName={chain.name??'Network'} openAccount={openAccountModal} openChain={openChainModal}/>;
}}</ConnectButton.Custom>}
