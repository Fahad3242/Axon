export const BRIDGE_A_ADDRESS = (process.env.NEXT_PUBLIC_BRIDGE_A_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const BRIDGE_B_ADDRESS = (process.env.NEXT_PUBLIC_BRIDGE_B_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_MOCK_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const WRAPPED_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_WRAPPED_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const BRIDGE_A_ABI = [
  {
    name: 'lockTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

export const BRIDGE_B_ABI = [
  {
    name: 'burnTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;
