// ─── Deployed Contracts — Base Mainnet (Chain ID: 8453) ──────────────────────

export const CONTRACTS = {
  TASK_REGISTRY:     '0xf7fe183835fc49089ead3ba36da24dda47e79618',
  REPUTATION_ORACLE: '0xddaed112351aecd7968056e2089079a4e8dc37ce',
  USDC:              '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
}

// ─── Task Registry ABI ────────────────────────────────────────────────────────

export const TASK_REGISTRY_ABI = [
  // Write
  { name: 'postTask', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'title', type: 'string' }, { name: 'description', type: 'string' },
      { name: 'category', type: 'string' }, { name: 'bounty', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ], outputs: [{ name: 'taskId', type: 'uint256' }] },
  { name: 'bidOnTask', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }, { name: 'proposal', type: 'string' }], outputs: [] },
  { name: 'assignTask', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }, { name: 'bidIndex', type: 'uint256' }], outputs: [] },
  { name: 'submitWork', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }, { name: 'deliverableHash', type: 'string' }], outputs: [] },
  { name: 'attestCompletion', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }, { name: 'rating', type: 'uint8' }], outputs: [] },
  { name: 'cancelTask', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }], outputs: [] },
  { name: 'disputeTask', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'taskId', type: 'uint256' }], outputs: [] },
  // Read
  { name: 'taskCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'getTaskCore', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [{ name: '', type: 'tuple', components: [
      { name: 'id', type: 'uint256' }, { name: 'poster', type: 'address' },
      { name: 'assignedAgent', type: 'address' }, { name: 'bounty', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }, { name: 'createdAt', type: 'uint256' },
      { name: 'status', type: 'uint8' }, { name: 'posterRating', type: 'uint8' },
    ]}] },
  { name: 'getTaskMeta', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [{ name: '', type: 'tuple', components: [
      { name: 'title', type: 'string' }, { name: 'description', type: 'string' },
      { name: 'category', type: 'string' }, { name: 'deliverableHash', type: 'string' },
      { name: 'completedAt', type: 'uint256' },
    ]}] },
  { name: 'getTaskBids', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'taskId', type: 'uint256' }],
    outputs: [{ name: '', type: 'tuple[]', components: [
      { name: 'agent', type: 'address' }, { name: 'proposal', type: 'string' },
      { name: 'bidAt', type: 'uint256' }, { name: 'selected', type: 'bool' },
    ]}] },
  { name: 'getPosterTasks', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'poster', type: 'address' }], outputs: [{ name: '', type: 'uint256[]' }] },
  { name: 'getAgentActiveTasks', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }], outputs: [{ name: '', type: 'uint256[]' }] },
  { name: 'getAgentStats', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: 'completed', type: 'uint256' }, { name: 'reputation', type: 'uint256' }] },
  { name: 'getOpenTaskIds', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'offset', type: 'uint256' }, { name: 'limit', type: 'uint256' }],
    outputs: [{ name: 'ids', type: 'uint256[]' }, { name: 'total', type: 'uint256' }] },
  // Events
  { name: 'TaskPosted', type: 'event', inputs: [
    { name: 'taskId', type: 'uint256', indexed: true }, { name: 'poster', type: 'address', indexed: true },
    { name: 'title', type: 'string', indexed: false }, { name: 'bounty', type: 'uint256', indexed: false },
    { name: 'deadline', type: 'uint256', indexed: false },
  ]},
  { name: 'TaskCompleted', type: 'event', inputs: [
    { name: 'taskId', type: 'uint256', indexed: true }, { name: 'agent', type: 'address', indexed: true },
    { name: 'poster', type: 'address', indexed: true }, { name: 'payment', type: 'uint256', indexed: false },
    { name: 'fee', type: 'uint256', indexed: false },
  ]},
]

export const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
]

export const REPUTATION_ORACLE_ABI = [
  { name: 'getScore', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'getStats', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'tuple', components: [
      { name: 'totalCompleted', type: 'uint256' }, { name: 'totalDisputed', type: 'uint256' },
      { name: 'ratingSum', type: 'uint256' }, { name: 'score', type: 'uint256' },
      { name: 'lastActive', type: 'uint256' },
    ]}] },
  { name: 'getHistory', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'tuple[]', components: [
      { name: 'taskId', type: 'uint256' }, { name: 'rating', type: 'uint8' },
      { name: 'timestamp', type: 'uint256' }, { name: 'disputed', type: 'bool' },
    ]}] },
]

export const TASK_STATUS = { 0: 'Open', 1: 'Assigned', 2: 'Submitted', 3: 'Completed', 4: 'Disputed', 5: 'Cancelled' }
export const TASK_CATEGORIES = ['code', 'data-analysis', 'research', 'content', 'design', 'moderation', 'trading', 'other']
