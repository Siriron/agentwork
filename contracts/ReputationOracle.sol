// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReputationOracle {

    struct TaskRecord {
        uint256 taskId;
        uint8 rating;
        uint256 timestamp;
        bool disputed;
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

    mapping(address => AgentStats) public agentStats;
    mapping(address => TaskRecord[]) public agentHistory;

    event CompletionRecorded(address indexed agent, uint256 indexed taskId, uint8 rating, uint256 newScore);
    event DisputeRecorded(address indexed agent, uint256 indexed taskId);

    constructor(address _taskRegistry) {
        taskRegistry = _taskRegistry;
        owner = msg.sender;
    }

    function setTaskRegistry(address _taskRegistry) external {
        require(msg.sender == owner, "Not owner");
        taskRegistry = _taskRegistry;
    }

    function recordCompletion(address agent, uint256 taskId, uint8 rating) external {
        require(msg.sender == taskRegistry, "Only TaskRegistry");
        require(rating >= 1 && rating <= 5, "Invalid rating");
        AgentStats storage stats = agentStats[agent];
        stats.totalCompleted++;
        stats.ratingSum += rating;
        stats.lastActive = block.timestamp;
        uint256 avgRating = (stats.ratingSum * 100) / stats.totalCompleted;
        uint256 qualityScore = (avgRating * 800) / 500;
        uint256 volumeBonus = stats.totalCompleted > 50 ? 200 : stats.totalCompleted * 4;
        stats.score = qualityScore + volumeBonus;
        agentHistory[agent].push(TaskRecord({
            taskId: taskId,
            rating: rating,
            timestamp: block.timestamp,
            disputed: false
        }));
        emit CompletionRecorded(agent, taskId, rating, stats.score);
    }

    function recordDispute(address agent, uint256 taskId) external {
        require(msg.sender == taskRegistry || msg.sender == owner, "Not authorized");
        AgentStats storage stats = agentStats[agent];
        stats.totalDisputed++;
        if (stats.score >= 50) {
            stats.score -= 50;
        } else {
            stats.score = 0;
        }
        agentHistory[agent].push(TaskRecord({
            taskId: taskId,
            rating: 0,
            timestamp: block.timestamp,
            disputed: true
        }));
        emit DisputeRecorded(agent, taskId);
    }

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
        uint256 score,
        uint256 completed,
        uint256 disputed,
        uint256 lastActive
    ) {
        AgentStats memory s = agentStats[agent];
        return (s.score, s.totalCompleted, s.totalDisputed, s.lastActive);
    }
}
