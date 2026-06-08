// ─── Contract Addresses (Base Mainnet) ───────────────────────────────────────
// Deploy TaskRegistry first, then ReputationOracle with TaskRegistry address.
// Update these after deployment.

export const CONTRACTS = {
  TASK_REGISTRY: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOY
  REPUTATION_ORACLE: '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOY
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  AGENT_IDENTITY_REGISTRY: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
}

// ─── Task Registry ABI ────────────────────────────────────────────────────────

export const TASK_REGISTRY_ABI = [
  // Write
  {
    name: 'postTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'bounty', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'taskId', type: 'uint256' }],
  },
  {
    name: 'bidOnTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'proposal', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'assignTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'bidIndex', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'submitWork',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'deliverableHash', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'attestCompletion',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskId', type: 'uint256' },
      { name: 'rating', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    name: 'cancelTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'disputeTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [],
  },
  // Read
  {
    name: 'getTask',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'poster', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'bounty', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'assignedAgent', type: 'address' },
          { name: 'deliverableHash', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'completedAt', type: 'uint256' },
          { name: 'posterRating', type: 'uint8' },
        ],
      },
    ],
  },
  {
    name: 'getTaskBids',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'agent', type: 'address' },
          { name: 'proposal', type: 'string' },
          { name: 'bidAt', type: 'uint256' },
          { name: 'selected', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'taskCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getOpenTasks',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [
      {
        name: 'result',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'poster', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'bounty', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'assignedAgent', type: 'address' },
          { name: 'deliverableHash', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'completedAt', type: 'uint256' },
          { name: 'posterRating', type: 'uint8' },
        ],
      },
      { name: 'total', type: 'uint256' },
    ],
  },
  {
    name: 'getAgentStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [
      { name: 'completed', type: 'uint256' },
      { name: 'reputation', type: 'uint256' },
    ],
  },
  // Events
  {
    name: 'TaskPosted',
    type: 'event',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'poster', type: 'address', indexed: true },
      { name: 'title', type: 'string', indexed: false },
      { name: 'bounty', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'TaskCompleted',
    type: 'event',
    inputs: [
      { name: 'taskId', type: 'uint256', indexed: true },
      { name: 'agent', type: 'address', indexed: true },
      { name: 'poster', type: 'address', indexed: true },
      { name: 'payment', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
]

// ─── ERC-20 USDC ABI (minimal) ────────────────────────────────────────────────

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
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
]

// ─── Reputation Oracle ABI ────────────────────────────────────────────────────

export const REPUTATION_ORACLE_ABI = [
  {
    name: 'getScore',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'totalCompleted', type: 'uint256' },
          { name: 'totalDisputed', type: 'uint256' },
          { name: 'ratingSum', type: 'uint256' },
          { name: 'score', type: 'uint256' },
          { name: 'lastActive', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getHistory',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'taskId', type: 'uint256' },
          { name: 'rating', type: 'uint8' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'disputed', type: 'bool' },
        ],
      },
    ],
  },
]

// ─── Task Status Map ──────────────────────────────────────────────────────────

export const TASK_STATUS = {
  0: 'Open',
  1: 'Assigned',
  2: 'Submitted',
  3: 'Completed',
  4: 'Disputed',
  5: 'Cancelled',
}

export const TASK_CATEGORIES = [
  'data-analysis',
  'code',
  'research',
  'content',
  'design',
  'trading',
  'moderation',
  'other',
]
