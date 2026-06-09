// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IReputationOracle {
    function recordCompletion(address agent, uint256 taskId, uint8 rating) external;
    function getScore(address agent) external view returns (uint256);
}

contract TaskRegistry {

    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    uint256 public constant PROTOCOL_FEE_BPS = 200;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MIN_BOUNTY = 1e6;
    uint256 public constant MAX_BIDS = 20;

    uint256 private _locked = 1;

    modifier nonReentrant() {
        require(_locked == 1, "Reentrant");
        _locked = 2;
        _;
        _locked = 1;
    }

    enum TaskStatus { Open, Assigned, Submitted, Completed, Disputed, Cancelled }

    // Split into two structs to avoid stack too deep
    struct TaskCore {
        uint256 id;
        address poster;
        address assignedAgent;
        uint256 bounty;
        uint256 deadline;
        uint256 createdAt;
        TaskStatus status;
        uint8 posterRating;
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
        string proposal;
        uint256 bidAt;
        bool selected;
    }

    uint256 public taskCount;
    address public feeRecipient;
    address public reputationOracle;

    mapping(uint256 => TaskCore) public taskCores;
    mapping(uint256 => TaskMeta) public taskMetas;
    mapping(uint256 => Bid[]) public taskBids;
    mapping(address => uint256[]) public agentActiveTasks;
    mapping(address => uint256[]) public posterTasks;
    mapping(address => uint256) public agentCompletedCount;

    event TaskPosted(uint256 indexed taskId, address indexed poster, string title, uint256 bounty, uint256 deadline);
    event BidSubmitted(uint256 indexed taskId, address indexed agent, uint256 bidIndex);
    event TaskAssigned(uint256 indexed taskId, address indexed agent);
    event WorkSubmitted(uint256 indexed taskId, address indexed agent, string deliverableHash);
    event TaskCompleted(uint256 indexed taskId, address indexed agent, address indexed poster, uint256 payment, uint256 fee);
    event TaskDisputed(uint256 indexed taskId, address indexed disputedBy);
    event TaskCancelled(uint256 indexed taskId);

    constructor(address _feeRecipient, address _reputationOracle) {
        require(_feeRecipient != address(0), "Zero address");
        feeRecipient = _feeRecipient;
        reputationOracle = _reputationOracle;
    }

    function postTask(
        string calldata title,
        string calldata description,
        string calldata category,
        uint256 bounty,
        uint256 deadline
    ) external nonReentrant returns (uint256 taskId) {
        require(bounty >= MIN_BOUNTY, "Bounty too low");
        require(deadline > block.timestamp, "Deadline in past");
        require(IERC20(USDC).transferFrom(msg.sender, address(this), bounty), "Transfer failed");

        taskId = ++taskCount;

        taskCores[taskId] = TaskCore({
            id: taskId,
            poster: msg.sender,
            assignedAgent: address(0),
            bounty: bounty,
            deadline: deadline,
            createdAt: block.timestamp,
            status: TaskStatus.Open,
            posterRating: 0
        });

        taskMetas[taskId] = TaskMeta({
            title: title,
            description: description,
            category: category,
            deliverableHash: "",
            completedAt: 0
        });

        posterTasks[msg.sender].push(taskId);
        emit TaskPosted(taskId, msg.sender, title, bounty, deadline);
    }

    function bidOnTask(uint256 taskId, string calldata proposal) external {
        TaskCore storage core = taskCores[taskId];
        require(core.status == TaskStatus.Open, "Task not open");
        require(core.deadline > block.timestamp, "Deadline passed");

        Bid[] storage bids = taskBids[taskId];
        require(bids.length < MAX_BIDS, "Max bids reached");

        for (uint256 i = 0; i < bids.length; i++) {
            require(bids[i].agent != msg.sender, "Already bid");
        }

        bids.push(Bid({ agent: msg.sender, proposal: proposal, bidAt: block.timestamp, selected: false }));
        emit BidSubmitted(taskId, msg.sender, bids.length - 1);
    }

    function assignTask(uint256 taskId, uint256 bidIndex) external {
        TaskCore storage core = taskCores[taskId];
        require(core.poster == msg.sender, "Not poster");
        require(core.status == TaskStatus.Open, "Task not open");

        Bid[] storage bids = taskBids[taskId];
        require(bidIndex < bids.length, "Invalid bid index");

        bids[bidIndex].selected = true;
        core.status = TaskStatus.Assigned;
        core.assignedAgent = bids[bidIndex].agent;

        agentActiveTasks[bids[bidIndex].agent].push(taskId);
        emit TaskAssigned(taskId, bids[bidIndex].agent);
    }

    function submitWork(uint256 taskId, string calldata deliverableHash) external {
        TaskCore storage core = taskCores[taskId];
        require(core.assignedAgent == msg.sender, "Not assigned agent");
        require(core.status == TaskStatus.Assigned, "Task not assigned");

        taskMetas[taskId].deliverableHash = deliverableHash;
        core.status = TaskStatus.Submitted;
        emit WorkSubmitted(taskId, msg.sender, deliverableHash);
    }

    function attestCompletion(uint256 taskId, uint8 rating) external nonReentrant {
        require(rating >= 1 && rating <= 5, "Invalid rating");

        TaskCore storage core = taskCores[taskId];
        require(core.poster == msg.sender, "Not poster");
        require(core.status == TaskStatus.Submitted, "Not submitted");

        core.status = TaskStatus.Completed;
        core.posterRating = rating;
        taskMetas[taskId].completedAt = block.timestamp;

        uint256 fee = (core.bounty * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 agentPayment = core.bounty - fee;
        address agent = core.assignedAgent;

        agentCompletedCount[agent]++;

        require(IERC20(USDC).transfer(agent, agentPayment), "Payment failed");
        require(IERC20(USDC).transfer(feeRecipient, fee), "Fee failed");

        if (reputationOracle != address(0)) {
            IReputationOracle(reputationOracle).recordCompletion(agent, taskId, rating);
        }

        emit TaskCompleted(taskId, agent, msg.sender, agentPayment, fee);
    }

    function disputeTask(uint256 taskId) external {
        TaskCore storage core = taskCores[taskId];
        require(msg.sender == core.poster || msg.sender == core.assignedAgent, "Not authorized");
        require(core.status == TaskStatus.Submitted || core.status == TaskStatus.Assigned, "Cannot dispute");
        core.status = TaskStatus.Disputed;
        emit TaskDisputed(taskId, msg.sender);
    }

    function cancelTask(uint256 taskId) external nonReentrant {
        TaskCore storage core = taskCores[taskId];
        require(core.poster == msg.sender, "Not poster");
        require(core.status == TaskStatus.Open, "Task not open");

        core.status = TaskStatus.Cancelled;
        require(IERC20(USDC).transfer(msg.sender, core.bounty), "Refund failed");
        emit TaskCancelled(taskId);
    }

    function getTaskCore(uint256 taskId) external view returns (TaskCore memory) { return taskCores[taskId]; }
    function getTaskMeta(uint256 taskId) external view returns (TaskMeta memory) { return taskMetas[taskId]; }
    function getTaskBids(uint256 taskId) external view returns (Bid[] memory) { return taskBids[taskId]; }
    function getPosterTasks(address poster) external view returns (uint256[] memory) { return posterTasks[poster]; }
    function getAgentActiveTasks(address agent) external view returns (uint256[] memory) { return agentActiveTasks[agent]; }

    function getAgentStats(address agent) external view returns (uint256 completed, uint256 reputation) {
        completed = agentCompletedCount[agent];
        if (reputationOracle != address(0)) {
            reputation = IReputationOracle(reputationOracle).getScore(agent);
        }
    }

    function getOpenTaskIds(uint256 offset, uint256 limit) external view returns (uint256[] memory ids, uint256 total) {
        uint256 count = 0;
        for (uint256 i = 1; i <= taskCount; i++) {
            if (taskCores[i].status == TaskStatus.Open) count++;
        }
        total = count;
        if (offset >= count) return (new uint256[](0), total);

        uint256 end = offset + limit > count ? count : offset + limit;
        ids = new uint256[](end - offset);
        uint256 found = 0;
        uint256 idx = 0;
        for (uint256 i = 1; i <= taskCount && idx < (end - offset); i++) {
            if (taskCores[i].status == TaskStatus.Open) {
                if (found >= offset) { ids[idx] = i; idx++; }
                found++;
            }
        }
    }

    function setReputationOracle(address _oracle) external {
        require(msg.sender == feeRecipient, "Not authorized");
        reputationOracle = _oracle;
    }
}
