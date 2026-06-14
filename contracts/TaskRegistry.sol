// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IReputationOracle {
    function recordCompletion(address agent, uint256 taskId, uint8 rating) external;
    function recordDispute(address agent, uint256 taskId) external;
}

/// @title TaskRegistry
/// @notice Decentralized task marketplace supporting ETH, USDC, and EURC bounties.
///         Gas-sponsorship-friendly: read functions cost nothing, write functions
///         that move real money require user signatures.
contract TaskRegistry {

    // ── Constants ──────────────────────────────────────────────────────────────

    address public constant ETH_TOKEN  = address(0);   // sentinel for native ETH
    uint256 public constant FEE_BPS    = 200;          // 2% protocol fee
    uint256 public constant BPS_BASE   = 10_000;
    uint256 public constant DISPUTE_WINDOW = 48 hours; // poster can dispute within 48h of submission
    uint256 public constant AUTO_RELEASE   = 7 days;   // auto-release if poster doesn't respond

    // ── Token whitelist ────────────────────────────────────────────────────────

    // mainnet minimums; testnet deployer should pass lower values via setTokenConfig
    struct TokenConfig {
        bool    allowed;
        uint256 minBounty;  // in token's native units
        string  symbol;
        uint8   decimals;
    }

    mapping(address => TokenConfig) public tokenConfig;
    address[] public allowedTokens;

    // ── Task storage ───────────────────────────────────────────────────────────

    enum Status { Open, Assigned, Submitted, Completed, Disputed, Cancelled }

    struct TaskCore {
        uint256 id;
        address poster;
        address assignedAgent;
        address token;        // ETH_TOKEN or ERC20 address
        uint256 bounty;
        uint256 deadline;
        uint256 createdAt;
        uint256 submittedAt;
        Status  status;
        uint8   posterRating;
    }

    struct TaskMeta {
        string title;
        string description;
        string category;
        string deliverableHash;
        uint256 completedAt;
    }

    struct Bid {
        address agent;
        string  proposal;
        uint256 bidAt;
        bool    selected;
    }

    uint256 public taskCount;

    mapping(uint256 => TaskCore) public tasks;
    mapping(uint256 => TaskMeta) public taskMeta;
    mapping(uint256 => Bid[])    public taskBids;

    mapping(address => uint256[]) public posterTasks;
    mapping(address => uint256[]) public agentBids;
    mapping(address => uint256[]) public agentAssigned;

    address public owner;
    address public feeRecipient;
    address public reputationOracle;
    bool    public paused;

    // ── Events ─────────────────────────────────────────────────────────────────

    event TaskPosted(uint256 indexed taskId, address indexed poster, address token, uint256 bounty, string category);
    event BidPlaced(uint256 indexed taskId, address indexed agent, uint256 bidIndex);
    event TaskAssigned(uint256 indexed taskId, address indexed agent);
    event WorkSubmitted(uint256 indexed taskId, address indexed agent, string deliverableHash);
    event TaskCompleted(uint256 indexed taskId, address indexed agent, uint8 rating, uint256 payout);
    event TaskCancelled(uint256 indexed taskId, address indexed poster);
    event TaskDisputed(uint256 indexed taskId, address indexed disputer);
    event DisputeResolved(uint256 indexed taskId, address winner);
    event DeadlineExtended(uint256 indexed taskId, uint256 newDeadline);
    event TokenConfigUpdated(address indexed token, bool allowed, uint256 minBounty);
    event Paused(bool state);

    // ── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyOwner()  { require(msg.sender == owner, "Not owner"); _; }
    modifier notPaused()  { require(!paused, "Contract paused"); _; }
    modifier taskExists(uint256 id) { require(id > 0 && id <= taskCount, "Task not found"); _; }

    // ── Constructor ────────────────────────────────────────────────────────────

    constructor(address _feeRecipient, address _reputationOracle) {
        owner            = msg.sender;
        feeRecipient     = _feeRecipient;
        reputationOracle = _reputationOracle;

        // Mainnet token whitelist with sensible minimums
        // ETH — 0.0002 ETH minimum
        _setToken(ETH_TOKEN, true, 0.0002 ether, "ETH", 18);
        // USDC on Base mainnet
        _setToken(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, true, 0.5e6, "USDC", 6);
        // EURC on Base mainnet
        _setToken(0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42, true, 0.5e6, "EURC", 6);
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    function setToken(address token, bool allowed, uint256 minBounty, string calldata symbol, uint8 decimals) external onlyOwner {
        _setToken(token, allowed, minBounty, symbol, decimals);
    }

    function _setToken(address token, bool allowed, uint256 minBounty, string memory symbol, uint8 decimals) internal {
        if (!tokenConfig[token].allowed && allowed) {
            allowedTokens.push(token);
        }
        tokenConfig[token] = TokenConfig({ allowed: allowed, minBounty: minBounty, symbol: symbol, decimals: decimals });
        emit TokenConfigUpdated(token, allowed, minBounty);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner { feeRecipient = _feeRecipient; }
    function setReputationOracle(address _oracle) external onlyOwner { reputationOracle = _oracle; }
    function setPaused(bool _paused) external onlyOwner { paused = _paused; emit Paused(_paused); }
    function transferOwnership(address newOwner) external onlyOwner { owner = newOwner; }

    // ── Core task flow ─────────────────────────────────────────────────────────

    /// @notice Post a task with USDC or EURC bounty (requires prior ERC20 approval)
    function postTask(
        string calldata title,
        string calldata description,
        string calldata category,
        address token,
        uint256 bounty,
        uint256 deadline
    ) external notPaused returns (uint256 taskId) {
        require(token != ETH_TOKEN, "Use postTaskETH for ETH");
        return _postTask(msg.sender, token, bounty, deadline, title, description, category);
    }

    /// @notice Post a task with native ETH bounty
    function postTaskETH(
        string calldata title,
        string calldata description,
        string calldata category,
        uint256 deadline
    ) external payable notPaused returns (uint256 taskId) {
        return _postTask(msg.sender, ETH_TOKEN, msg.value, deadline, title, description, category);
    }

    function _postTask(
        address poster,
        address token,
        uint256 bounty,
        uint256 deadline,
        string memory title,
        string memory description,
        string memory category
    ) internal returns (uint256 taskId) {
        TokenConfig memory cfg = tokenConfig[token];
        require(cfg.allowed, "Token not whitelisted");
        require(bounty >= cfg.minBounty, "Below minimum bounty");
        require(deadline > block.timestamp + 1 hours, "Deadline too soon");
        require(bytes(title).length > 0 && bytes(title).length <= 120, "Invalid title");
        require(bytes(description).length > 0, "Empty description");

        // Pull ERC20 from sender (ETH already received via msg.value)
        if (token != ETH_TOKEN) {
            require(IERC20(token).transferFrom(poster, address(this), bounty), "Transfer failed");
        }

        taskId = ++taskCount;

        tasks[taskId] = TaskCore({
            id:            taskId,
            poster:        poster,
            assignedAgent: address(0),
            token:         token,
            bounty:        bounty,
            deadline:      deadline,
            createdAt:     block.timestamp,
            submittedAt:   0,
            status:        Status.Open,
            posterRating:  0
        });

        taskMeta[taskId] = TaskMeta({
            title:           title,
            description:     description,
            category:        category,
            deliverableHash: "",
            completedAt:     0
        });

        posterTasks[poster].push(taskId);

        emit TaskPosted(taskId, poster, token, bounty, category);
    }

    /// @notice Agent places a bid on an open task — gasless-sponsorable
    function bidOnTask(uint256 taskId, string calldata proposal) external notPaused taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(t.status == Status.Open, "Task not open");
        require(t.poster != msg.sender, "Poster cannot bid");
        require(block.timestamp < t.deadline, "Deadline passed");
        require(bytes(proposal).length > 0, "Empty proposal");

        // Prevent duplicate bids
        Bid[] storage bids = taskBids[taskId];
        for (uint256 i = 0; i < bids.length; i++) {
            require(bids[i].agent != msg.sender, "Already bid");
        }

        uint256 bidIndex = bids.length;
        bids.push(Bid({ agent: msg.sender, proposal: proposal, bidAt: block.timestamp, selected: false }));
        agentBids[msg.sender].push(taskId);

        emit BidPlaced(taskId, msg.sender, bidIndex);
    }

    /// @notice Poster assigns the task to a bidder
    function assignTask(uint256 taskId, uint256 bidIndex) external notPaused taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(msg.sender == t.poster, "Not poster");
        require(t.status == Status.Open, "Task not open");
        require(bidIndex < taskBids[taskId].length, "Invalid bid index");

        Bid storage bid = taskBids[taskId][bidIndex];
        bid.selected      = true;
        t.assignedAgent   = bid.agent;
        t.status          = Status.Assigned;

        agentAssigned[bid.agent].push(taskId);

        emit TaskAssigned(taskId, bid.agent);
    }

    /// @notice Assigned agent submits work — gasless-sponsorable
    function submitWork(uint256 taskId, string calldata deliverableHash) external notPaused taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(msg.sender == t.assignedAgent, "Not assigned agent");
        require(t.status == Status.Assigned, "Not assigned");
        require(block.timestamp < t.deadline, "Deadline passed");
        require(bytes(deliverableHash).length > 0, "Empty deliverable");

        t.status                        = Status.Submitted;
        t.submittedAt                   = block.timestamp;
        taskMeta[taskId].deliverableHash = deliverableHash;

        emit WorkSubmitted(taskId, msg.sender, deliverableHash);
    }

    /// @notice Poster approves work and releases bounty
    function attestCompletion(uint256 taskId, uint8 rating) external notPaused taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(msg.sender == t.poster, "Not poster");
        require(t.status == Status.Submitted, "Work not submitted");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");

        t.status        = Status.Completed;
        t.posterRating  = rating;
        taskMeta[taskId].completedAt = block.timestamp;

        _releaseBounty(t);

        if (reputationOracle != address(0)) {
            IReputationOracle(reputationOracle).recordCompletion(t.assignedAgent, taskId, rating);
        }

        emit TaskCompleted(taskId, t.assignedAgent, rating, _agentPayout(t.bounty));
    }

    /// @notice Auto-release: anyone can trigger after AUTO_RELEASE window with no poster response
    function autoRelease(uint256 taskId) external notPaused taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(t.status == Status.Submitted, "Work not submitted");
        require(block.timestamp >= t.submittedAt + AUTO_RELEASE, "Too early");

        t.status = Status.Completed;
        taskMeta[taskId].completedAt = block.timestamp;

        _releaseBounty(t);

        if (reputationOracle != address(0)) {
            IReputationOracle(reputationOracle).recordCompletion(t.assignedAgent, taskId, 3); // neutral rating on auto
        }

        emit TaskCompleted(taskId, t.assignedAgent, 3, _agentPayout(t.bounty));
    }

    /// @notice Poster disputes submitted work within DISPUTE_WINDOW — gasless-sponsorable
    function disputeTask(uint256 taskId) external notPaused taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(msg.sender == t.poster, "Not poster");
        require(t.status == Status.Submitted, "Work not submitted");
        require(block.timestamp <= t.submittedAt + DISPUTE_WINDOW, "Dispute window closed");

        t.status = Status.Disputed;

        if (reputationOracle != address(0)) {
            IReputationOracle(reputationOracle).recordDispute(t.assignedAgent, taskId);
        }

        emit TaskDisputed(taskId, msg.sender);
    }

    /// @notice Owner resolves dispute: true = pay agent, false = refund poster
    function resolveDispute(uint256 taskId, bool payAgent) external onlyOwner taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(t.status == Status.Disputed, "Not disputed");

        if (payAgent) {
            t.status = Status.Completed;
            taskMeta[taskId].completedAt = block.timestamp;
            _releaseBounty(t);
            emit DisputeResolved(taskId, t.assignedAgent);
        } else {
            t.status = Status.Cancelled;
            _refundPoster(t);
            emit DisputeResolved(taskId, t.poster);
        }
    }

    /// @notice Poster cancels — only allowed if no bids yet
    function cancelTask(uint256 taskId) external notPaused taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(msg.sender == t.poster, "Not poster");
        require(t.status == Status.Open, "Can only cancel open tasks");
        require(taskBids[taskId].length == 0, "Cannot cancel: bids exist");

        t.status = Status.Cancelled;
        _refundPoster(t);

        emit TaskCancelled(taskId, msg.sender);
    }

    /// @notice Poster extends deadline — only before current deadline and task must be open/assigned
    function extendDeadline(uint256 taskId, uint256 newDeadline) external notPaused taskExists(taskId) {
        TaskCore storage t = tasks[taskId];
        require(msg.sender == t.poster, "Not poster");
        require(t.status == Status.Open || t.status == Status.Assigned, "Cannot extend");
        require(newDeadline > t.deadline, "New deadline must be later");
        require(newDeadline > block.timestamp + 1 hours, "Too soon");

        t.deadline = newDeadline;
        emit DeadlineExtended(taskId, newDeadline);
    }

    // ── Payout helpers ─────────────────────────────────────────────────────────

    function _agentPayout(uint256 bounty) internal pure returns (uint256) {
        return bounty - (bounty * FEE_BPS / BPS_BASE);
    }

    function _releaseBounty(TaskCore storage t) internal {
        uint256 fee    = t.bounty * FEE_BPS / BPS_BASE;
        uint256 payout = t.bounty - fee;

        if (t.token == ETH_TOKEN) {
            _sendETH(t.assignedAgent, payout);
            _sendETH(feeRecipient, fee);
        } else {
            require(IERC20(t.token).transfer(t.assignedAgent, payout), "Payout failed");
            require(IERC20(t.token).transfer(feeRecipient, fee), "Fee transfer failed");
        }
    }

    function _refundPoster(TaskCore storage t) internal {
        if (t.token == ETH_TOKEN) {
            _sendETH(t.poster, t.bounty);
        } else {
            require(IERC20(t.token).transfer(t.poster, t.bounty), "Refund failed");
        }
    }

    function _sendETH(address to, uint256 amount) internal {
        (bool ok,) = to.call{ value: amount }("");
        require(ok, "ETH transfer failed");
    }

    // ── Read functions ─────────────────────────────────────────────────────────

    function getTaskCore(uint256 taskId) external view returns (TaskCore memory) {
        return tasks[taskId];
    }

    function getTaskMeta(uint256 taskId) external view returns (TaskMeta memory) {
        return taskMeta[taskId];
    }

    function getTaskBids(uint256 taskId) external view returns (Bid[] memory) {
        return taskBids[taskId];
    }

    function getPosterTasks(address poster) external view returns (uint256[] memory) {
        return posterTasks[poster];
    }

    function getAgentBids(address agent) external view returns (uint256[] memory) {
        return agentBids[agent];
    }

    function getAgentAssigned(address agent) external view returns (uint256[] memory) {
        return agentAssigned[agent];
    }

    function getAgentStats(address agent) external view returns (uint256 completed, uint256 reputation) {
        uint256 c = 0;
        uint256[] memory assigned = agentAssigned[agent];
        for (uint256 i = 0; i < assigned.length; i++) {
            if (tasks[assigned[i]].status == Status.Completed) c++;
        }
        return (c, 0); // reputation comes from oracle
    }

    function getAllowedTokens() external view returns (address[] memory) {
        return allowedTokens;
    }

    function getOpenTaskIds(uint256 offset, uint256 limit) external view returns (uint256[] memory ids, uint256 total) {
        uint256 count = 0;
        for (uint256 i = 1; i <= taskCount; i++) {
            if (tasks[i].status == Status.Open && block.timestamp < tasks[i].deadline) count++;
        }
        total = count;
        uint256 end = offset + limit > count ? count : offset + limit;
        ids = new uint256[](end > offset ? end - offset : 0);
        uint256 idx = 0; uint256 skipped = 0;
        for (uint256 i = 1; i <= taskCount && idx < ids.length; i++) {
            if (tasks[i].status == Status.Open && block.timestamp < tasks[i].deadline) {
                if (skipped < offset) { skipped++; continue; }
                ids[idx++] = i;
            }
        }
    }

    function getTasksByCategory(string calldata category, uint256 offset, uint256 limit)
        external view returns (uint256[] memory ids)
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= taskCount; i++) {
            if (keccak256(bytes(taskMeta[i].category)) == keccak256(bytes(category)) &&
                tasks[i].status == Status.Open) count++;
        }
        uint256 end = offset + limit > count ? count : offset + limit;
        ids = new uint256[](end > offset ? end - offset : 0);
        uint256 idx = 0; uint256 skipped = 0;
        for (uint256 i = 1; i <= taskCount && idx < ids.length; i++) {
            if (keccak256(bytes(taskMeta[i].category)) == keccak256(bytes(category)) &&
                tasks[i].status == Status.Open) {
                if (skipped < offset) { skipped++; continue; }
                ids[idx++] = i;
            }
        }
    }

    receive() external payable {}
}
