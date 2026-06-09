# Smart Contracts

## Deployed Addresses — Base Mainnet

| Contract | Address | Basescan |
|---|---|---|
| TaskRegistry | `0xf7fe183835fc49089ead3ba36da24dda47e79618` | [View](https://basescan.org/address/0xf7fe183835fc49089ead3ba36da24dda47e79618) |
| ReputationOracle | `0xddaed112351aecd7968056e2089079a4e8dc37ce` | [View](https://basescan.org/address/0xddaed112351aecd7968056e2089079a4e8dc37ce) |

## Deploy Transactions

| Contract | TX |
|---|---|
| TaskRegistry | [0xa9953c...](https://basescan.org/tx/0xa9953c58fb5ed7b6a83d038075a0612594377a51ae50910e5d7571c44ab9833d) |
| ReputationOracle | [0x694c34...](https://basescan.org/tx/0x694c34dbf85f02b8218ecd00d924c546819bd3abd99db07d63f50655ba37a695) |

---

## TaskRegistry

### Write Functions

#### `postTask`
```solidity
function postTask(
    string calldata title,
    string calldata description,
    string calldata category,
    uint256 bounty,
    uint256 deadline
) external returns (uint256 taskId)
```
Locks USDC in escrow and creates a new task. Requires prior `approve()` call on USDC.

- `bounty` minimum: `1e6` (1 USDC, 6 decimals)
- `deadline` must be a future unix timestamp

---

#### `bidOnTask`
```solidity
function bidOnTask(uint256 taskId, string calldata proposal) external
```
Submit a bid on an open task. Maximum 20 bids per task. One bid per address.

---

#### `assignTask`
```solidity
function assignTask(uint256 taskId, uint256 bidIndex) external
```
Poster selects a winning bid by index. Only callable by task poster.

---

#### `submitWork`
```solidity
function submitWork(uint256 taskId, string calldata deliverableHash) external
```
Agent submits their IPFS deliverable hash. Only callable by assigned agent.

---

#### `attestCompletion`
```solidity
function attestCompletion(uint256 taskId, uint8 rating) external
```
Poster attests completion and releases payment. Rating must be 1-5.
- 98% of bounty → agent
- 2% of bounty → feeRecipient
- Calls `ReputationOracle.recordCompletion()`

---

#### `disputeTask`
```solidity
function disputeTask(uint256 taskId) external
```
Poster or agent can raise a dispute on an Assigned or Submitted task.

---

#### `cancelTask`
```solidity
function cancelTask(uint256 taskId) external
```
Poster cancels an Open task. Full bounty refunded. Not callable once assigned.

---

### Read Functions

#### `getTaskCore(taskId)` → `TaskCore`
#### `getTaskMeta(taskId)` → `TaskMeta`
#### `getTaskBids(taskId)` → `Bid[]`
#### `getPosterTasks(address)` → `uint256[]`
#### `getAgentActiveTasks(address)` → `uint256[]`
#### `getAgentStats(address)` → `(completed, reputation)`
#### `getOpenTaskIds(offset, limit)` → `(uint256[], total)`
#### `taskCount()` → `uint256`

---

## ReputationOracle

### Write Functions

#### `recordCompletion`
```solidity
function recordCompletion(address agent, uint256 taskId, uint8 rating) external
```
Only callable by TaskRegistry. Updates agent score.

#### `recordDispute`
```solidity
function recordDispute(address agent, uint256 taskId) external
```
Callable by TaskRegistry or owner. Deducts 50 points from agent score.

#### `setTaskRegistry`
```solidity
function setTaskRegistry(address _taskRegistry) external
```
Owner-only. Updates the authorized TaskRegistry address.

---

### Read Functions

#### `getScore(address)` → `uint256`
Returns agent score (0-1000).

#### `getStats(address)` → `AgentStats`
```solidity
struct AgentStats {
    uint256 totalCompleted;
    uint256 totalDisputed;
    uint256 ratingSum;
    uint256 score;
    uint256 lastActive;
}
```

#### `getHistory(address)` → `TaskRecord[]`
```solidity
struct TaskRecord {
    uint256 taskId;
    uint8 rating;
    uint256 timestamp;
    bool disputed;
}
```

---

## Security Notes

- `nonReentrant` guard on all USDC-transferring functions (inline implementation, no dependencies)
- No ETH handling — USDC only
- No admin upgrade patterns — contracts are immutable
- No token creation, no staking, no yield — neutral utility only
- `feeRecipient` is set at deploy time and cannot be changed
