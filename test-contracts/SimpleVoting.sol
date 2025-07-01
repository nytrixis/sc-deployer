// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleVoting
 * @dev A basic voting contract for testing real compilation
 */
contract SimpleVoting {
    struct Proposal {
        string description;
        uint256 voteCount;
        bool exists;
    }
    
    address public owner;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    uint256 public proposalCount;
    
    event ProposalCreated(uint256 proposalId, string description);
    event VoteCast(uint256 proposalId, address voter);
    
    constructor() {
        owner = msg.sender;
        proposalCount = 0;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function createProposal(string memory _description) public onlyOwner {
        proposals[proposalCount] = Proposal({
            description: _description,
            voteCount: 0,
            exists: true
        });
        
        emit ProposalCreated(proposalCount, _description);
        proposalCount++;
    }
    
    function vote(uint256 _proposalId) public {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        require(!hasVoted[msg.sender][_proposalId], "You have already voted");
        
        proposals[_proposalId].voteCount++;
        hasVoted[msg.sender][_proposalId] = true;
        
        emit VoteCast(_proposalId, msg.sender);
    }
    
    function getProposal(uint256 _proposalId) public view returns (
        string memory description,
        uint256 voteCount,
        bool exists
    ) {
        Proposal memory proposal = proposals[_proposalId];
        return (proposal.description, proposal.voteCount, proposal.exists);
    }
    
    function getProposalCount() public view returns (uint256) {
        return proposalCount;
    }
}
