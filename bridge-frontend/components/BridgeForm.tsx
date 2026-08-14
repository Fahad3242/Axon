'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits } from 'viem';
import { ArrowDownUp, ChevronDown, Edit3, LockKeyhole, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { TOKEN_ADDRESS, WRAPPED_TOKEN_ADDRESS, BRIDGE_A_ADDRESS, ERC20_ABI } from '@/lib/contracts';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useApproveToken } from '@/hooks/useTokenApproval';
import { useLockTokens } from '@/hooks/useBridgeA';
import { useBurnTokens } from '@/hooks/useBridgeB';
import TransactionStatus from './TransactionStatus';

export default function BridgeForm() {
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();
  const [forward, setForward] = useState(true);
  const [amount, setAmount] = useState('');
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [srcTxHash, setSrcTxHash] = useState('');
  const { balance: ttBalance, refetch: refetchTT } = useTokenBalance(TOKEN_ADDRESS);
  const { balance: wttBalance, refetch: refetchWTT } = useTokenBalance(WRAPPED_TOKEN_ADDRESS);
  const balance = forward ? ttBalance : wttBalance;
  const sourceToken = forward ? 'TT' : 'wTT';
  const targetToken = forward ? 'wTT' : 'TT';
  const sourceNet = forward ? 'Sepolia' : 'Amoy';
  const targetNet = forward ? 'Amoy' : 'Sepolia';
  const targetChainId = forward ? 11155111 : 80002;
  const parsedAmount = amount ? parseUnits(amount, 18) : 0n;
  const { data: allowance, refetch: refetchAllowance } = useReadContract({ address: TOKEN_ADDRESS, abi: ERC20_ABI, functionName: 'allowance', args: address && BRIDGE_A_ADDRESS ? [address, BRIDGE_A_ADDRESS] : undefined, query: { enabled: !!address && forward } });
  const approval = useApproveToken(BRIDGE_A_ADDRESS, parsedAmount);
  const locking = useLockTokens();
  const burning = useBurnTokens();
  const approved = approval.isSuccess || (allowance !== undefined && allowance >= parsedAmount);
  const busy = approval.isPending || approval.isConfirming || locking.isPending || locking.isConfirming || burning.isPending || burning.isConfirming;
  const numericAmount = Number(amount || 0);
  const valid = numericAmount > 0 && numericAmount <= Number(balance || 0);

  useEffect(() => { if (locking.txHash) setSrcTxHash(locking.txHash); }, [locking.txHash]);
  useEffect(() => { if (burning.txHash) setSrcTxHash(burning.txHash); }, [burning.txHash]);
  useEffect(() => { if (approval.error) toast.error(approval.error.message || 'Approval failed'); }, [approval.error]);
  useEffect(() => { if (locking.error) toast.error(locking.error.message || 'Bridge failed'); }, [locking.error]);
  useEffect(() => { if (burning.error) toast.error(burning.error.message || 'Bridge failed'); }, [burning.error]);
  useEffect(() => { if (approval.isSuccess) { refetchAllowance(); toast.success('Token approved'); } }, [approval.isSuccess, refetchAllowance]);
  useEffect(() => { if (locking.isSuccess) { refetchTT(); toast.success('Tokens locked on Sepolia'); } }, [locking.isSuccess, refetchTT]);
  useEffect(() => { if (burning.isSuccess) { refetchWTT(); toast.success('Tokens burned on Amoy'); } }, [burning.isSuccess, refetchWTT]);

  const state = !isConnected ? 'connect' : chain?.id !== targetChainId ? 'network' : !amount || numericAmount <= 0 ? 'amount' : numericAmount > Number(balance || 0) ? 'funds' : forward && !approved ? 'approve' : 'bridge';
  const labels = { connect: 'Connect wallet', network: `Switch to ${sourceNet}`, amount: 'Enter an amount', funds: 'Insufficient balance', approve: `Approve ${sourceToken}`, bridge: `Bridge ${sourceToken} to ${targetNet}` };
  const act = () => {
    if (state === 'connect') return openConnectModal?.();
    if (state === 'network') return switchChain({ chainId: targetChainId });
    if (state === 'approve') return approval.approve();
    if (state === 'bridge') return forward ? locking.lock(parsedAmount) : burning.burn(parsedAmount);
  };
  const flip = () => { setForward(v => !v); setAmount(''); };

  if (srcTxHash) return <div className="bridge-wrap"><section className="bridge-card"><TransactionStatus srcTxHash={srcTxHash} /><button className="bridge-cta enabled" onClick={() => { setSrcTxHash(''); setAmount(''); }}>Start another transfer</button></section></div>;

  return (
    <div className="bridge-wrap">
      <div className="balances"><span><i className="sep" />TT (Sepolia) <b>{Number(ttBalance).toFixed(4)}</b></span><span><i className="amo" />wTT (Amoy) <b>{Number(wttBalance).toFixed(4)}</b></span></div>
      <section className="bridge-card">
        <div className={`link-grid ${valid ? 'flowing' : ''}`}>
          <motion.div className="chain-node" layout transition={{type:'spring',stiffness:280,damping:28}}>
            <div className="node-head"><span className="node-label source">◉ Source</span><button onClick={() => setAmount(balance)}>Balance <b>{Number(balance).toFixed(4)} {sourceToken}</b></button></div>
            <div className="amount-row"><input aria-label="Bridge amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => { const v=e.target.value; if (v==='' || /^\d*\.?\d*$/.test(v)) setAmount(v); }} /><TokenPill symbol={sourceToken} network={sourceNet} source /></div>
            <small>≈ ${numericAmount.toFixed(2)}</small>
          </motion.div>
          <div className="connector"><div className="track"><i /></div><motion.button whileHover={{scale:1.1,y:-1}} whileTap={{scale:.88,rotate:180}} transition={{type:'spring',stiffness:420,damping:20}} onClick={flip} aria-label="Reverse bridge direction"><motion.span animate={{rotate:forward?0:180}} transition={{type:'spring',stiffness:300,damping:24}}><ArrowDownUp /></motion.span></motion.button></div>
          <motion.div className="chain-node" layout transition={{type:'spring',stiffness:280,damping:28}}>
            <div className="node-head"><span className="node-label destination">◉ Destination</span><button onClick={() => setRecipientOpen(v => !v)}><Edit3 />{recipient ? 'Recipient set' : 'Set recipient'}</button></div>
            <div className="amount-row"><div className={`output ${numericAmount ? '' : 'empty'}`}>{numericAmount ? numericAmount.toFixed(2) : '0.00'}</div><TokenPill symbol={targetToken} network={targetNet} /></div>
            <small>≈ ${numericAmount.toFixed(2)}</small>
            <AnimatePresence>{recipientOpen && <motion.input initial={{opacity:0,y:-6,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4,scale:.98}} className="recipient" placeholder="0x recipient address" value={recipient} onChange={e => setRecipient(e.target.value)} />}</AnimatePresence>
          </motion.div>
        </div>
        <div className="summary"><p><span>Exchange rate</span><b>1 {sourceToken} = 1 {targetToken}</b></p><p><span>Estimated time</span><b>~2–5 minutes</b></p><p><span>Protocol fee</span><b>0.00%</b></p></div>
        <button className={`bridge-cta ${['connect','network','approve','bridge'].includes(state) ? 'enabled' : ''}`} disabled={busy || ['amount','funds'].includes(state)} onClick={act}>{busy && <Loader2 className="spin" />}{labels[state]}</button>
      </section>
      <p className="security-note"><LockKeyhole />Secured by Axon decentralized relayers · Contracts verified on-chain</p>
    </div>
  );
}

function TokenPill({ symbol, network, source = false }: { symbol: string; network: string; source?: boolean }) {
  return <div className="token-pill"><i className={source ? 'source-token' : 'target-token'}>{symbol}</i><span><b>{symbol}</b><small>{network}</small></span><ChevronDown /></div>;
}
