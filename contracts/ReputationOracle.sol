// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ReputationOracle
/// @notice Tracks agent reputation scores from completed and disputed tasks.
///         Only callable by the TaskRegistry contract.
contract ReputationOracle {

    struct TaskRecord {
        uint256 taskId;
        uint8   rating;
        uint256 timestamp;
        bool    disputed;
    }

    struct AgentStats {
        uint256 totalCompleted;
        uint256 totalDisputed;
        uint256 ratingSum;
        uint256 score;
        uint256 lastActive;
    }

    address public taskRegistry;
    address public owner;
    bool    public paused;

    mapping(address => AgentStats)   public agentStats;
    mapping(address => TaskRecord[]) public agentHistory;

    event CompletionRecorded(address indexed agent, uint256 indexed taskId, uint8 rating, uint256 newScore);
    event DisputeRecorded(address indexed agent, uint256 indexed taskId, uint256 newScore);
    event RegistryUpdated(address indexed newRegistry);
    event Paused(bool state);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyRegistry() { require(msg.sender == taskRegistry, "Only TaskRegistry"); _; }
    modifier notPaused() { require(!paused, "Paused"); _; }

    constructor(address _taskRegistry) {
        taskRegistry = _taskRegistry;
        owner = msg.sender;
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    function setTaskRegistry(address _registry) external onlyOwner {
        taskRegistry = _registry;
        emit RegistryUpdated(_registry);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    // ── Called by TaskRegistry ─────────────────────────────────────────────────

    function recordCompletion(address agent, uint256 taskId, uint8 rating) external onlyRegistry notPaused {
        require(rating >= 1 && rating <= 5, "Invalid rating");

        AgentStats storage s = agentStats[agent];
        s.totalCompleted++;
        s.ratingSum   += rating;
        s.lastActive   = block.timestamp;

        // Score formula: quality (0-800) + volume bonus (0-200) = max 1000
        uint256 avgRating   = (s.ratingSum * 100) / s.totalCompleted;     // scaled x100
        uint256 qualScore   = (avgRating * 800) / 500;                     // 500 = perfect avg*100
        uint256 volBonus    = s.totalCompleted >= 50 ? 200 : s.totalCompleted * 4;
        // Dispute penalty applied on top
        uint256 penalty     = s.totalDisputed * 50;
        s.score             = qualScore + volBonus > penalty ? qualScore + volBonus - penalty : 0;

        agentHistory[agent].push(TaskRecord({
            taskId:    taskId,
            rating:    rating,
            timestamp: block.timestamp,
            disputed:  false
        }));

        emit CompletionRecorded(agent, taskId, rating, s.score);
    }

    function recordDispute(address agent, uint256 taskId) external notPaused {
        require(msg.sender == taskRegistry || msg.sender == owner, "Not authorized");

        AgentStats storage s = agentStats[agent];
        s.totalDisputed++;
        s.score = s.score >= 50 ? s.score - 50 : 0;

        agentHistory[agent].push(TaskRecord({
            taskId:    taskId,
            rating:    0,
            timestamp: block.timestamp,
            disputed:  true
        }));

        emit DisputeRecorded(agent, taskId, s.score);
    }

    // ── Views ──────────────────────────────────────────────────────────────────

    function getScore(address agent) external view returns (uint256) {
        return agentStats[agent].score;
    }

    function getStats(address agent) external view returns (AgentStats memory) {
        return agentStats[agent];
    }

    function getHistory(address agent) external view returns (TaskRecord[] memory) {
        return agentHistory[agent];
    }

    function getAgentRank(address agent) external view returns (
        uint256 score, uint256 completed, uint256 disputed, uint256 avgRating, uint256 lastActive
    ) {
        AgentStats memory s = agentStats[agent];
        uint256 avg = s.totalCompleted > 0 ? (s.ratingSum * 100) / s.totalCompleted : 0;
        return (s.score, s.totalCompleted, s.totalDisputed, avg, s.lastActive);
    }

    /// @notice Returns top agents by score. Max 50 returned.
    function getLeaderboard(address[] calldata agents) external view returns (
        address[] memory sorted, uint256[] memory scores
    ) {
        uint256 len = agents.length > 50 ? 50 : agents.length;
        sorted = new address[](len);
        scores = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            sorted[i] = agents[i];
            scores[i] = agentStats[agents[i]].score;
        }
        // Bubble sort (small N only — called off-chain)
        for (uint256 i = 0; i < len; i++) {
            for (uint256 j = i + 1; j < len; j++) {
                if (scores[j] > scores[i]) {
                    (scores[i], scores[j]) = (scores[j], scores[i]);
                    (sorted[i], sorted[j]) = (sorted[j], sorted[i]);
                }
            }
        }
    }
}
