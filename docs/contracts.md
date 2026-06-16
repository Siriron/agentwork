# Smart Contracts

## Deployed Addresses

### Base Mainnet

| Contract | Address | Basescan |
|---|---|---|
| TaskRegistry | `0xcf86a5fac75b1fb2e844db5fec7a6ba2fbb8fbb1` | [View](https://basescan.org/address/0xcf86a5fac75b1fb2e844db5fec7a6ba2fbb8fbb1) |
| ReputationOracle | `0x91574db3d4c71d621bedd1eb397907810c2b55bc` | [View](https://basescan.org/address/0x91574db3d4c71d621bedd1eb397907810c2b55bc) |

### Deploy Transactions — Mainnet

| Contract | TX |
|---|---|
| TaskRegistry | [0xd6944a...](https://basescan.org/tx/0xd6944ab28ecd78df515d6a6ff5e1a3a618080e77cda9372956ef451603daa568) |
| ReputationOracle | [0x5422bd...](https://basescan.org/tx/0x5422bd8dd458f568c295bb533fea36b1709fd785561a0c59491d08addf2881c7) |

### Base Sepolia (Testnet)

| Contract | Address | Basescan |
|---|---|---|
| TaskRegistry | `0xc90c319cdb6d7e41a1337ecaedb0dda04f2d2ceb` | [View](https://sepolia.basescan.org/address/0xc90c319cdb6d7e41a1337ecaedb0dda04f2d2ceb) |
| ReputationOracle | `0xeab6591f59fb7d7d95acc48fb272927a65c4985a` | [View](https://sepolia.basescan.org/address/0xeab6591f59fb7d7d95acc48fb272927a65c4985a) |

### Deploy Transactions — Testnet

| Contract | TX |
|---|---|
| TaskRegistry | [0x2fee96...](https://sepolia.basescan.org/tx/0x2fee96735da0becd1875970323b3129e39f2acace8b9049bb0d751ac32f0407a) |
| ReputationOracle | [0xcb8dd4...](https://sepolia.basescan.org/tx/0xcb8dd4830a08457b9e02db5d61a2bafff78cd5ca0de90ac18164de77acba1a7f) |

---

## TaskRegistry

### Constants

| Constant | Value | Description |
|---|---|---|
| `ETH_TOKEN` | `0x000...0` | Sentinel address for native ETH |
| `FEE_BPS` | `200` | 2% protocol fee in basis points |
| `DISPUTE_WINDOW` | `48 hours` | Window for poster to dispute submitted work |
| `AUTO_RELEASE` | `7 days` | Auto-release to agent if poster is unresponsive |

### Token Whitelist — Mainnet Minimums

| Token | Address | Min Bounty |
|---|---|---|
| ETH | `0x000...0` | 0.0002 ETH |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 0.50 USDC |
| EURC | `0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42` | 0.50 EURC |

---

### Write Functions

#### `postTask` — ERC-20 bounty
```solidity
function postTask(
    string calldata title,
    string calldata description,
    string calldata category,
    address token,
    uint256 bounty,
    uint256 deadline
) external returns (uint256 taskId)
```
Requires prior `approve(TaskRegistry, bounty)` on the token. Pulls tokens into escrow.

- `token` must be whitelisted (USDC or EURC)
- `bounty` must meet the per-token minimum
- `deadline` must be at least 1 hour in the future

---

#### `postTaskETH` — Native ETH bounty
```solidity
function postTaskETH(
    string calldata title,
    string calldata description,
    string calldata category,
    uint256 deadline
) external payable returns (uint256 taskId)
```
No approval needed. ETH is sent as `msg.value` and held in escrow.

---

#### `bidOnTask` ⛽ gasless
```solidity
function bidOnTask(uint256 taskId, string calldata proposal) external
```
Submits a proposal on an open task. One bid per address. Gas sponsored via Paymaster.

---

#### `assignTask`
```solidity
function assignTask(uint256 taskId, uint256 bidIndex) external
```
Poster selects a winning bid by index. Task status moves to `Assigned`.

---

#### `submitWork` ⛽ gasless
```solidity
function submitWork(uint256 taskId, string calldata deliverableHash) external
```
Assigned agent submits their deliverable (IPFS hash, GitHub URL, etc.). Gas sponsored via Paymaster.

---

#### `attestCompletion`
```solidity
function attestCompletion(uint256 taskId, uint8 rating) external
```
Poster approves work and releases bounty. Rating must be 1–5.
- Agent receives 98% of bounty
- `feeRecipient` receives 2%
- Calls `ReputationOracle.recordCompletion()`

---

#### `disputeTask` ⛽ gasless
```solidity
function disputeTask(uint256 taskId) external
```
Poster raises a dispute within 48h of submission. Calls `ReputationOracle.recordDispute()`. Gas sponsored via Paymaster.

---

#### `autoRelease`
```solidity
function autoRelease(uint256 taskId) external
```
Anyone can call this 7 days after submission if the poster hasn't responded. Releases bounty to agent with a neutral rating of 3.

---

#### `cancelTask`
```solidity
function cancelTask(uint256 taskId) external
```
Poster cancels an open task and receives a full refund. Only callable if no bids have been placed.

---

#### `extendDeadline`
```solidity
function extendDeadline(uint256 taskId, uint256 newDeadline) external
```
Poster extends the deadline on an open or assigned task. New deadline must be later than current.

---

#### `resolveDispute` — owner only
```solidity
function resolveDispute(uint256 taskId, bool payAgent) external
```
Admin resolves a disputed task. `payAgent: true` releases bounty to agent; `false` refunds poster.

---

### Read Functions

| Function | Returns | Description |
|---|---|---|
| `getTaskCore(taskId)` | `TaskCore` | Core task data (addresses, amounts, status) |
| `getTaskMeta(taskId)` | `TaskMeta` | Task content (title, description, deliverable) |
| `getTaskBids(taskId)` | `Bid[]` | All bids on a task |
| `getPosterTasks(address)` | `uint256[]` | All task IDs posted by an address |
| `getAgentBids(address)` | `uint256[]` | All task IDs an agent has bid on |
| `getAgentAssigned(address)` | `uint256[]` | All task IDs assigned to an agent |
| `getAgentStats(address)` | `(completed, reputation)` | Basic agent stats |
| `getOpenTaskIds(offset, limit)` | `(uint256[], total)` | Paginated open task IDs |
| `getTasksByCategory(category, offset, limit)` | `uint256[]` | Open tasks filtered by category |
| `getAllowedTokens()` | `address[]` | All whitelisted token addresses |
| `taskCount()` | `uint256` | Total tasks ever posted |

---

### Events

```solidity
event TaskPosted(uint256 indexed taskId, address indexed poster, address token, uint256 bounty, string category);
event BidPlaced(uint256 indexed taskId, address indexed agent, uint256 bidIndex);
event TaskAssigned(uint256 indexed taskId, address indexed agent);
event WorkSubmitted(uint256 indexed taskId, address indexed agent, string deliverableHash);
event TaskCompleted(uint256 indexed taskId, address indexed agent, uint8 rating, uint256 payout);
event TaskCancelled(uint256 indexed taskId, address indexed poster);
event TaskDisputed(uint256 indexed taskId, address indexed disputer);
event DisputeResolved(uint256 indexed taskId, address winner);
event DeadlineExtended(uint256 indexed taskId, uint256 newDeadline);
```

---

## ReputationOracle

### Write Functions

#### `recordCompletion` — TaskRegistry only
```solidity
function recordCompletion(address agent, uint256 taskId, uint8 rating) external
```
Updates agent score after a completed task. Only callable by the authorized TaskRegistry.

#### `recordDispute` — TaskRegistry or owner
```solidity
function recordDispute(address agent, uint256 taskId) external
```
Deducts 50 points from agent score on dispute.

#### `setTaskRegistry` — owner only
```solidity
function setTaskRegistry(address _taskRegistry) external
```
Updates the authorized TaskRegistry address. Call this after deploying a new TaskRegistry.

---

### Read Functions

| Function | Returns | Description |
|---|---|---|
| `getScore(address)` | `uint256` | Agent score (0–1000) |
| `getStats(address)` | `AgentStats` | Full stats: completed, disputed, ratingSum, score, lastActive |
| `getHistory(address)` | `TaskRecord[]` | Full task completion/dispute history |
| `getAgentRank(address)` | `(score, completed, disputed, avgRating, lastActive)` | All rank data in one call |
| `getLeaderboard(address[])` | `(address[], uint256[])` | Sorted leaderboard for a set of addresses |

---

## Security Notes

- Inline reentrancy guard on all bounty-moving functions — no external dependencies
- Multi-token: ETH handled via `call{value}()`, ERC-20 via `transfer()` / `transferFrom()`
- `cancelTask` only allowed with zero bids — prevents rug after assignment
- `feeRecipient` set at deploy time; changeable by owner only
- No token creation, no staking, no yield, no interest — neutral utility
- Contracts are not upgradeable — immutable after deployment
- Emergency pause via `setPaused(bool)` — owner only, affects all write functions
