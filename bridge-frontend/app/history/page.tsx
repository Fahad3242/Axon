'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, History as HistoryIcon, Loader2, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import Navbar from '@/components/Navbar';

interface HistoryItem { id:string; time:string|number; route:string; amount:string; status:'PENDING'|'CONFIRMING'|'RELAYING'|'COMPLETED'|'FAILED'; sourceTx:string; destTx?:string }

export default function HistoryPage(){
  const {address,isConnected}=useAccount();
  const [history,setHistory]=useState<HistoryItem[]>([]);
  const [loading,setLoading]=useState(true);
  const relayerUrl=process.env.NEXT_PUBLIC_RELAYER_API_URL||'http://localhost:3001';
  const fetchHistory=useCallback(async(showLoading=false)=>{
    if(!address){setHistory([]);setLoading(false);return} if(showLoading)setLoading(true);
    try{const response=await fetch(`${relayerUrl}/bridge/history/${address}`);if(!response.ok)throw new Error();setHistory(await response.json())}
    catch{const local=localStorage.getItem('axon_bridge_history');setHistory(local?JSON.parse(local):[])}finally{setLoading(false)}
  },[address,relayerUrl]);
  useEffect(()=>{fetchHistory(true)},[fetchHistory]);
  useEffect(()=>{if(!address)return;const timer=setInterval(()=>{if(history.some(tx=>!['COMPLETED','FAILED'].includes(tx.status)))fetchHistory()},10000);return()=>clearInterval(timer)},[address,history,fetchHistory]);
  const relative=(value:string|number)=>{const date=new Date(value);if(Number.isNaN(date.getTime()))return String(value);const mins=Math.floor((Date.now()-date.getTime())/60000);if(mins<1)return'Just now';if(mins<60)return`${mins} min${mins===1?'':'s'} ago`;const hours=Math.floor(mins/60);return hours<24?`${hours} hour${hours===1?'':'s'} ago`:`${Math.floor(hours/24)} days ago`};
  const hash=(value?:string)=>value?`${value.slice(0,6)}...${value.slice(-4)}`:'—';
  const explorer=(value:string|undefined,sepolia:boolean)=>value?<a className="tx-link" href={`${sepolia?'https://sepolia.etherscan.io':'https://amoy.polygonscan.com'}/tx/${value}`} target="_blank" rel="noreferrer">{hash(value)}<ExternalLink/></a>:<span className="tx-empty">—</span>;
  return <div className="site-shell"><div className="wrap"><Navbar/><motion.main className="history-main" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.45,ease:[.22,1,.36,1]}}>
    <div className="history-heading"><span className="history-kicker"><HistoryIcon/>Bridge activity</span><h1 className="history-title">Transaction history</h1><p className="history-sub">Track every signal sent through the Axon bridge.</p></div>
    {!isConnected?<Empty icon={<Wallet/>} title="Wallet not connected" copy="Connect your wallet to view transaction history."/>:loading?<div className="history-loading"><Loader2/>Loading bridge activity…</div>:history.length===0?<Empty icon={<HistoryIcon/>} title="No transactions yet" copy="Your bridge transactions will appear here."/>:<>
      <div className="history-card desktop-history"><table className="history-table"><thead><tr><th>Time</th><th>Route</th><th>Amount</th><th>Status</th><th>Source tx</th><th>Destination tx</th></tr></thead><motion.tbody initial="hidden" animate="show" variants={{show:{transition:{staggerChildren:.06}}}}>{history.map(tx=>{const sep=tx.route.startsWith('Sepolia');const parts=tx.route.split(/→|â†’/);return <motion.tr key={tx.id} variants={{hidden:{opacity:0,y:10},show:{opacity:1,y:0}}} transition={{duration:.35}}><td>{relative(tx.time)}</td><td><span className="route"><b>{parts[0]?.trim()}</b><ArrowRight/><b>{parts[1]?.trim()}</b></span></td><td className="amount-cell">{tx.amount}</td><td><Status value={tx.status}/></td><td>{explorer(tx.sourceTx,sep)}</td><td>{explorer(tx.destTx,!sep)}</td></motion.tr>})}</motion.tbody></table></div>
      <motion.div className="mobile-history" initial="hidden" animate="show" variants={{show:{transition:{staggerChildren:.07}}}}>{history.map(tx=>{const sep=tx.route.startsWith('Sepolia');return <motion.article className="history-item" key={tx.id} variants={{hidden:{opacity:0,y:12},show:{opacity:1,y:0}}}><div><span>{relative(tx.time)}</span><Status value={tx.status}/></div><h3>{tx.route}</h3><strong>{tx.amount}</strong><footer><span>Source {explorer(tx.sourceTx,sep)}</span><span>Destination {explorer(tx.destTx,!sep)}</span></footer></motion.article>})}</motion.div>
    </>}
  </motion.main></div></div>
}

function Status({value}:{value:HistoryItem['status']}){return <span className={`status-pill ${value.toLowerCase()}`}><i/>{value}</span>}
function Empty({icon,title,copy}:{icon:React.ReactNode;title:string;copy:string}){return <motion.div className="empty-card" initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}}><i>{icon}</i><h2>{title}</h2><p>{copy}</p></motion.div>}
