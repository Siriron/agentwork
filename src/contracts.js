// ── Addresses ──────────────────────────────────────────────────────────────────

export const MAINNET_CONTRACTS = {
  TASK_REGISTRY:     '0xcf86a5fac75b1fb2e844db5fec7a6ba2fbb8fbb1',
  REPUTATION_ORACLE: '0x91574db3d4c71d621bedd1eb397907810c2b55bc',
}

export const TESTNET_CONTRACTS = {
  TASK_REGISTRY:     '0xc90c319cdb6d7e41a1337ecaedb0dda04f2d2ceb',
  REPUTATION_ORACLE: '0xeab6591f59fb7d7d95acc48fb272927a65c4985a',
}

// ── Tokens ─────────────────────────────────────────────────────────────────────

export const ETH_TOKEN = '0x0000000000000000000000000000000000000000'

export const MAINNET_TOKENS = [
  {
    address:     ETH_TOKEN,
    symbol:      'ETH',
    name:        'Ethereum',
    decimals:    18,
    icon:        '⟠',
    minBounty:   0.0002,
    minBountyWei:'200000000000000',
    color:       '#627EEA',
  },
  {
    address:     '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol:      'USDC',
    name:        'USD Coin',
    decimals:    6,
    icon:        '💵',
    minBounty:   0.50,
    minBountyWei:'500000',
    color:       '#2775CA',
  },
  {
    address:     '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
    symbol:      'EURC',
    name:        'Euro Coin',
    decimals:    6,
    icon:        '€',
    minBounty:   0.50,
    minBountyWei:'500000',
    color:       '#003399',
  },
]

export const TESTNET_TOKENS = [
  {
    address:     ETH_TOKEN,
    symbol:      'ETH',
    name:        'Sepolia ETH',
    decimals:    18,
    icon:        '⟠',
    minBounty:   0.00001,
    minBountyWei:'10000000000000',
    color:       '#627EEA',
  },
  {
    address:     '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    symbol:      'USDC',
    name:        'USDC (Testnet)',
    decimals:    6,
    icon:        '💵',
    minBounty:   0.01,
    minBountyWei:'10000',
    color:       '#2775CA',
  },
  {
    address:     '0x808456652fdb597867f38412077A9182bf77359',
    symbol:      'EURC',
    name:        'EURC (Testnet)',
    decimals:    6,
    icon:        '€',
    minBounty:   0.01,
    minBountyWei:'10000',
    color:       '#003399',
  },
]

// ── Sponsored functions (gasless via Paymaster) ────────────────────────────────
export const SPONSORED_FUNCTIONS = ['bidOnTask', 'submitWork', 'disputeTask']

// ── Task categories ────────────────────────────────────────────────────────────
export const TASK_CATEGORIES = [
  'code', 'data-analysis', 'research', 'content',
  'design', 'moderation', 'translation', 'automation', 'other'
]

// ── ABIs ───────────────────────────────────────────────────────────────────────

export const ERC20_ABI = [
  { name:'approve',   type:'function', stateMutability:'nonpayable', inputs:[{name:'spender',type:'address'},{name:'amount',type:'uint256'}], outputs:[{name:'',type:'bool'}] },
  { name:'allowance', type:'function', stateMutability:'view',       inputs:[{name:'owner',type:'address'},{name:'spender',type:'address'}],  outputs:[{name:'',type:'uint256'}] },
  { name:'balanceOf', type:'function', stateMutability:'view',       inputs:[{name:'account',type:'address'}],                               outputs:[{name:'',type:'uint256'}] },
]

export const TASK_REGISTRY_ABI = [
  { name:'postTask',         type:'function', stateMutability:'nonpayable', inputs:[{name:'title',type:'string'},{name:'description',type:'string'},{name:'category',type:'string'},{name:'token',type:'address'},{name:'bounty',type:'uint256'},{name:'deadline',type:'uint256'}], outputs:[{name:'taskId',type:'uint256'}] },
  { name:'postTaskETH',      type:'function', stateMutability:'payable',    inputs:[{name:'title',type:'string'},{name:'description',type:'string'},{name:'category',type:'string'},{name:'deadline',type:'uint256'}], outputs:[{name:'taskId',type:'uint256'}] },
  { name:'attestCompletion', type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'},{name:'rating',type:'uint8'}], outputs:[] },
  { name:'cancelTask',       type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'}], outputs:[] },
  { name:'resolveDispute',   type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'},{name:'payAgent',type:'bool'}], outputs:[] },
  { name:'extendDeadline',   type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'},{name:'newDeadline',type:'uint256'}], outputs:[] },
  { name:'autoRelease',      type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'}], outputs:[] },
  { name:'bidOnTask',        type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'},{name:'proposal',type:'string'}], outputs:[] },
  { name:'assignTask',       type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'},{name:'bidIndex',type:'uint256'}], outputs:[] },
  { name:'submitWork',       type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'},{name:'deliverableHash',type:'string'}], outputs:[] },
  { name:'disputeTask',      type:'function', stateMutability:'nonpayable', inputs:[{name:'taskId',type:'uint256'}], outputs:[] },
  { name:'taskCount',          type:'function', stateMutability:'view', inputs:[], outputs:[{name:'',type:'uint256'}] },
  { name:'getTaskCore',        type:'function', stateMutability:'view', inputs:[{name:'taskId',type:'uint256'}], outputs:[{name:'',type:'tuple',components:[{name:'id',type:'uint256'},{name:'poster',type:'address'},{name:'assignedAgent',type:'address'},{name:'token',type:'address'},{name:'bounty',type:'uint256'},{name:'deadline',type:'uint256'},{name:'createdAt',type:'uint256'},{name:'submittedAt',type:'uint256'},{name:'status',type:'uint8'},{name:'posterRating',type:'uint8'}]}] },
  { name:'getTaskMeta',        type:'function', stateMutability:'view', inputs:[{name:'taskId',type:'uint256'}], outputs:[{name:'',type:'tuple',components:[{name:'title',type:'string'},{name:'description',type:'string'},{name:'category',type:'string'},{name:'deliverableHash',type:'string'},{name:'completedAt',type:'uint256'}]}] },
  { name:'getTaskBids',        type:'function', stateMutability:'view', inputs:[{name:'taskId',type:'uint256'}], outputs:[{name:'',type:'tuple[]',components:[{name:'agent',type:'address'},{name:'proposal',type:'string'},{name:'bidAt',type:'uint256'},{name:'selected',type:'bool'}]}] },
  { name:'getPosterTasks',     type:'function', stateMutability:'view', inputs:[{name:'poster',type:'address'}], outputs:[{name:'',type:'uint256[]'}] },
  { name:'getAgentBids',       type:'function', stateMutability:'view', inputs:[{name:'agent',type:'address'}], outputs:[{name:'',type:'uint256[]'}] },
  { name:'getAgentAssigned',   type:'function', stateMutability:'view', inputs:[{name:'agent',type:'address'}], outputs:[{name:'',type:'uint256[]'}] },
  { name:'getAgentStats',      type:'function', stateMutability:'view', inputs:[{name:'agent',type:'address'}], outputs:[{name:'completed',type:'uint256'},{name:'reputation',type:'uint256'}] },
  { name:'getOpenTaskIds',     type:'function', stateMutability:'view', inputs:[{name:'offset',type:'uint256'},{name:'limit',type:'uint256'}], outputs:[{name:'ids',type:'uint256[]'},{name:'total',type:'uint256'}] },
  { name:'getTasksByCategory', type:'function', stateMutability:'view', inputs:[{name:'category',type:'string'},{name:'offset',type:'uint256'},{name:'limit',type:'uint256'}], outputs:[{name:'ids',type:'uint256[]'}] },
  { name:'getAllowedTokens',   type:'function', stateMutability:'view', inputs:[], outputs:[{name:'',type:'address[]'}] },
]

export const REPUTATION_ORACLE_ABI = [
  { name:'getScore',      type:'function', stateMutability:'view', inputs:[{name:'agent',type:'address'}], outputs:[{name:'',type:'uint256'}] },
  { name:'getStats',      type:'function', stateMutability:'view', inputs:[{name:'agent',type:'address'}], outputs:[{name:'',type:'tuple',components:[{name:'totalCompleted',type:'uint256'},{name:'totalDisputed',type:'uint256'},{name:'ratingSum',type:'uint256'},{name:'score',type:'uint256'},{name:'lastActive',type:'uint256'}]}] },
  { name:'getHistory',    type:'function', stateMutability:'view', inputs:[{name:'agent',type:'address'}], outputs:[{name:'',type:'tuple[]',components:[{name:'taskId',type:'uint256'},{name:'rating',type:'uint8'},{name:'timestamp',type:'uint256'},{name:'disputed',type:'bool'}]}] },
  { name:'getAgentRank',  type:'function', stateMutability:'view', inputs:[{name:'agent',type:'address'}], outputs:[{name:'score',type:'uint256'},{name:'completed',type:'uint256'},{name:'disputed',type:'uint256'},{name:'avgRating',type:'uint256'},{name:'lastActive',type:'uint256'}] },
  { name:'getLeaderboard',type:'function', stateMutability:'view', inputs:[{name:'agents',type:'address[]'}], outputs:[{name:'sorted',type:'address[]'},{name:'scores',type:'uint256[]'}] },
]
