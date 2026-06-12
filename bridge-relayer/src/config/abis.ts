export const BRIDGE_A_ABI = [
  'event TokenLocked(address indexed sender, uint256 amount, uint256 destinationChainId, bytes32 txHash)',
  'event TokenReleased(address indexed recipient, uint256 amount, bytes32 srcTxHash)',
  'function releaseTokens(address recipient, uint256 amount, bytes32 srcTxHash) external',
];

export const BRIDGE_B_ABI = [
  'event TokenMinted(address indexed recipient, uint256 amount, bytes32 srcTxHash)',
  'event TokenBurned(address indexed sender, uint256 amount, bytes32 txHash)',
  'function mintTokens(address recipient, uint256 amount, bytes32 srcTxHash) external',
];
