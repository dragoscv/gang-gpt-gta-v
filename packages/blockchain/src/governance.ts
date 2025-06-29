import { EventEmitter } from 'events';
import { z } from 'zod';
import {
    GovernanceProposal,
    BlockchainTransaction,
    BlockchainConfig,
    BlockchainError
} from './types';

/**
 * DAO Governance Service for GangGPT
 * Manages community governance, voting, and proposal execution
 */
export class GovernanceService extends EventEmitter {
    private config: BlockchainConfig;
    private proposals: Map<string, GovernanceProposal> = new Map();
    private votes: Map<string, Vote[]> = new Map(); // proposalId -> votes
    private delegates: Map<string, string> = new Map(); // delegator -> delegate
    private votingPower: Map<string, VotingPower> = new Map(); // address -> voting power

    constructor(config: BlockchainConfig) {
        super();
        this.config = config;
        this.initializeGovernance();
    }

    /**
     * Initialize governance with default settings
     */
    private async initializeGovernance(): Promise<void> {
        // Set up governance parameters
        this.governanceConfig = {
            proposalThreshold: '1000000', // 1M tokens to create proposal
            quorumThreshold: '10000000', // 10M tokens for quorum
            votingDelay: 24 * 60 * 60, // 24 hours
            votingPeriod: 7 * 24 * 60 * 60, // 7 days
            executionDelay: 2 * 24 * 60 * 60, // 2 days
            gracePeriod: 14 * 24 * 60 * 60, // 14 days
        };
    }

    /**
     * Create a new governance proposal
     */
    async createProposal(
        proposer: string,
        title: string,
        description: string,
        proposalType: 'gameFeature' | 'economicPolicy' | 'serverRule' | 'communityEvent',
        actions: ProposalAction[]
    ): Promise<string> {
        try {
            // Check if proposer has enough voting power
            const proposerPower = await this.getVotingPower(proposer);
            if (parseFloat(proposerPower.total) < parseFloat(this.governanceConfig.proposalThreshold)) {
                throw new BlockchainError(
                    `Insufficient voting power. Required: ${this.governanceConfig.proposalThreshold}`,
                    'INSUFFICIENT_VOTING_POWER'
                );
            }

            const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();

            const proposal: GovernanceProposal = {
                id: proposalId,
                title,
                description,
                proposer,
                proposalType,
                votingPower: {
                    for: '0',
                    against: '0',
                    abstain: '0',
                },
                status: 'pending',
                createdAt: now,
                votingStartsAt: new Date(now.getTime() + this.governanceConfig.votingDelay * 1000),
                votingEndsAt: new Date(now.getTime() + (this.governanceConfig.votingDelay + this.governanceConfig.votingPeriod) * 1000),
                executionDelay: this.governanceConfig.executionDelay,
                quorumRequired: this.governanceConfig.quorumThreshold,
                votingThreshold: '50', // 50% majority
            };

            // Store proposal with actions
            this.proposals.set(proposalId, proposal);
            this.proposalActions.set(proposalId, actions);
            this.votes.set(proposalId, []);

            // Schedule voting start
            setTimeout(() => {
                proposal.status = 'active';
                this.emit('proposalActive', { proposal });
            }, this.governanceConfig.votingDelay * 1000);

            // Schedule voting end
            setTimeout(() => {
                this.finalizeProposal(proposalId);
            }, (this.governanceConfig.votingDelay + this.governanceConfig.votingPeriod) * 1000);

            this.emit('proposalCreated', { proposal, actions });

            return proposalId;
        } catch (error) {
            throw new BlockchainError(
                `Failed to create proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'PROPOSAL_CREATION_FAILED'
            );
        }
    }

    /**
     * Cast a vote on a proposal
     */
    async castVote(
        voter: string,
        proposalId: string,
        support: 'for' | 'against' | 'abstain',
        reason?: string
    ): Promise<string> {
        try {
            const proposal = this.proposals.get(proposalId);
            if (!proposal) {
                throw new BlockchainError('Proposal not found', 'PROPOSAL_NOT_FOUND');
            }

            const now = new Date();

            // Check if voting is active
            if (proposal.status !== 'active') {
                throw new BlockchainError('Voting is not active for this proposal', 'VOTING_NOT_ACTIVE');
            }

            if (now < proposal.votingStartsAt || now > proposal.votingEndsAt) {
                throw new BlockchainError('Voting period has ended', 'VOTING_PERIOD_ENDED');
            }

            // Check if voter already voted
            const existingVotes = this.votes.get(proposalId) || [];
            if (existingVotes.some(v => v.voter === voter)) {
                throw new BlockchainError('Already voted on this proposal', 'ALREADY_VOTED');
            }

            // Get voter's voting power
            const votingPower = await this.getVotingPower(voter);
            const weight = votingPower.total;

            // Create vote
            const vote: Vote = {
                id: `vote_${Date.now()}_${voter}`,
                proposalId,
                voter,
                support,
                weight,
                reason,
                timestamp: now,
                blockNumber: Math.floor(Math.random() * 1000000),
            };

            // Add vote to proposal
            existingVotes.push(vote);
            this.votes.set(proposalId, existingVotes);

            // Update proposal voting power
            switch (support) {
                case 'for':
                    proposal.votingPower.for = (parseFloat(proposal.votingPower.for) + parseFloat(weight)).toString();
                    break;
                case 'against':
                    proposal.votingPower.against = (parseFloat(proposal.votingPower.against) + parseFloat(weight)).toString();
                    break;
                case 'abstain':
                    proposal.votingPower.abstain = (parseFloat(proposal.votingPower.abstain) + parseFloat(weight)).toString();
                    break;
            }

            // Create transaction record
            const transaction: BlockchainTransaction = {
                id: vote.id,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'vote',
                from: voter,
                to: this.config.contractAddresses.governance,
                gasUsed: '0.0005',
                gasPrice: '0.000005',
                status: 'confirmed',
                timestamp: now,
                blockNumber: vote.blockNumber,
                metadata: {
                    proposalId,
                    support,
                    weight,
                    reason,
                },
            };

            this.emit('votecast', { vote, proposal, transaction });

            return vote.id;
        } catch (error) {
            throw new BlockchainError(
                `Failed to cast vote: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'VOTE_CASTING_FAILED'
            );
        }
    }

    /**
     * Delegate voting power to another address
     */
    async delegateVotingPower(delegator: string, delegate: string): Promise<string> {
        try {
            // Remove previous delegation if exists
            this.delegates.delete(delegator);

            // Set new delegation
            this.delegates.set(delegator, delegate);

            // Update voting power calculations
            await this.updateVotingPower(delegator);
            await this.updateVotingPower(delegate);

            const transaction: BlockchainTransaction = {
                id: `delegate_${Date.now()}_${delegator}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'transfer',
                from: delegator,
                to: delegate,
                gasUsed: '0.0003',
                gasPrice: '0.000005',
                status: 'confirmed',
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    action: 'delegate',
                    delegator,
                    delegate,
                },
            };

            this.emit('votingPowerDelegated', { delegator, delegate, transaction });

            return transaction.id;
        } catch (error) {
            throw new BlockchainError(
                `Failed to delegate voting power: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DELEGATION_FAILED'
            );
        }
    }

    /**
     * Execute a successful proposal
     */
    async executeProposal(proposalId: string, executor: string): Promise<string> {
        try {
            const proposal = this.proposals.get(proposalId);
            if (!proposal) {
                throw new BlockchainError('Proposal not found', 'PROPOSAL_NOT_FOUND');
            }

            if (proposal.status !== 'succeeded') {
                throw new BlockchainError('Proposal is not ready for execution', 'PROPOSAL_NOT_READY');
            }

            const now = new Date();
            const executionTime = new Date(proposal.votingEndsAt.getTime() + proposal.executionDelay * 1000);

            if (now < executionTime) {
                throw new BlockchainError('Execution delay period has not passed', 'EXECUTION_DELAY_ACTIVE');
            }

            // Get proposal actions
            const actions = this.proposalActions.get(proposalId) || [];

            // Execute each action
            const executionResults: ActionExecutionResult[] = [];
            for (const action of actions) {
                const result = await this.executeAction(action);
                executionResults.push(result);
            }

            // Update proposal status
            proposal.status = 'executed';

            const transaction: BlockchainTransaction = {
                id: `execute_${Date.now()}_${proposalId}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'transfer',
                from: executor,
                to: this.config.contractAddresses.governance,
                gasUsed: '0.005',
                gasPrice: '0.000005',
                status: 'confirmed',
                timestamp: now,
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    proposalId,
                    actionsExecuted: actions.length,
                    executionResults,
                },
            };

            this.emit('proposalExecuted', { proposal, executionResults, transaction });

            return transaction.id;
        } catch (error) {
            throw new BlockchainError(
                `Failed to execute proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'PROPOSAL_EXECUTION_FAILED'
            );
        }
    }

    /**
     * Get voting power for an address
     */
    async getVotingPower(address: string): Promise<VotingPower> {
        let cached = this.votingPower.get(address);
        if (cached && cached.lastUpdated > new Date(Date.now() - 60000)) { // 1 minute cache
            return cached;
        }

        // Calculate voting power from tokens, NFTs, and delegations
        const tokenBalance = await this.getTokenBalance(address);
        const nftPower = await this.getNFTVotingPower(address);
        const delegatedPower = await this.getDelegatedVotingPower(address);

        const votingPower: VotingPower = {
            address,
            tokens: tokenBalance,
            nfts: nftPower,
            delegated: delegatedPower,
            total: (parseFloat(tokenBalance) + parseFloat(nftPower) + parseFloat(delegatedPower)).toString(),
            lastUpdated: new Date(),
        };

        this.votingPower.set(address, votingPower);
        return votingPower;
    }

    /**
     * Get all proposals with optional filtering
     */
    getProposals(filter?: {
        status?: 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed';
        proposalType?: 'gameFeature' | 'economicPolicy' | 'serverRule' | 'communityEvent';
        proposer?: string;
    }): GovernanceProposal[] {
        let proposals = Array.from(this.proposals.values());

        if (filter) {
            if (filter.status) {
                proposals = proposals.filter(p => p.status === filter.status);
            }
            if (filter.proposalType) {
                proposals = proposals.filter(p => p.proposalType === filter.proposalType);
            }
            if (filter.proposer) {
                proposals = proposals.filter(p => p.proposer === filter.proposer);
            }
        }

        return proposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    /**
     * Get votes for a proposal
     */
    getProposalVotes(proposalId: string): Vote[] {
        return this.votes.get(proposalId) || [];
    }

    /**
     * Get governance statistics
     */
    async getGovernanceStats(): Promise<GovernanceStats> {
        const proposals = Array.from(this.proposals.values());
        const totalVotingPower = Array.from(this.votingPower.values())
            .reduce((sum, vp) => sum + parseFloat(vp.total), 0);

        return {
            totalProposals: proposals.length,
            activeProposals: proposals.filter(p => p.status === 'active').length,
            executedProposals: proposals.filter(p => p.status === 'executed').length,
            totalVotingPower: totalVotingPower.toString(),
            uniqueVoters: new Set(Array.from(this.votes.values()).flat().map(v => v.voter)).size,
            participationRate: this.calculateParticipationRate(),
        };
    }

    // Private helper methods
    private async finalizeProposal(proposalId: string): Promise<void> {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) return;

        const totalVotes = parseFloat(proposal.votingPower.for) +
            parseFloat(proposal.votingPower.against) +
            parseFloat(proposal.votingPower.abstain);

        // Check quorum
        if (totalVotes < parseFloat(proposal.quorumRequired)) {
            proposal.status = 'defeated';
            this.emit('proposalDefeated', { proposal, reason: 'quorum_not_met' });
            return;
        }

        // Check majority
        const forPercentage = (parseFloat(proposal.votingPower.for) / totalVotes) * 100;
        if (forPercentage > parseFloat(proposal.votingThreshold)) {
            proposal.status = 'succeeded';
            this.emit('proposalSucceeded', { proposal });
        } else {
            proposal.status = 'defeated';
            this.emit('proposalDefeated', { proposal, reason: 'majority_not_met' });
        }
    }

    private async executeAction(action: ProposalAction): Promise<ActionExecutionResult> {
        try {
            switch (action.type) {
                case 'changeParameter':
                    return await this.executeParameterChange(action);
                case 'transferFunds':
                    return await this.executeTransfer(action);
                case 'updateContract':
                    return await this.executeContractUpdate(action);
                case 'addFeature':
                    return await this.executeFeatureAddition(action);
                default:
                    throw new Error(`Unknown action type: ${action.type}`);
            }
        } catch (error) {
            return {
                action,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
            };
        }
    }

    private async executeParameterChange(action: ProposalAction): Promise<ActionExecutionResult> {
        // Implementation for parameter changes
        return {
            action,
            success: true,
            result: `Parameter ${action.target} changed to ${action.value}`,
            timestamp: new Date(),
        };
    }

    private async executeTransfer(action: ProposalAction): Promise<ActionExecutionResult> {
        // Implementation for fund transfers
        return {
            action,
            success: true,
            result: `Transferred ${action.value} to ${action.target}`,
            timestamp: new Date(),
        };
    }

    private async executeContractUpdate(action: ProposalAction): Promise<ActionExecutionResult> {
        // Implementation for contract updates
        return {
            action,
            success: true,
            result: `Contract ${action.target} updated`,
            timestamp: new Date(),
        };
    }

    private async executeFeatureAddition(action: ProposalAction): Promise<ActionExecutionResult> {
        // Implementation for feature additions
        return {
            action,
            success: true,
            result: `Feature ${action.target} added`,
            timestamp: new Date(),
        };
    }

    private async updateVotingPower(address: string): Promise<void> {
        // Force recalculation of voting power
        this.votingPower.delete(address);
        await this.getVotingPower(address);
    }

    private async getTokenBalance(address: string): Promise<string> {
        // Mock implementation - would fetch from blockchain
        return '1000000';
    }

    private async getNFTVotingPower(address: string): Promise<string> {
        // Mock implementation - would calculate based on NFT holdings
        return '500000';
    }

    private async getDelegatedVotingPower(address: string): Promise<string> {
        // Calculate voting power delegated to this address
        let delegatedPower = 0;
        for (const [delegator, delegate] of this.delegates) {
            if (delegate === address) {
                const delegatorPower = await this.getTokenBalance(delegator);
                delegatedPower += parseFloat(delegatorPower);
            }
        }
        return delegatedPower.toString();
    }

    private calculateParticipationRate(): number {
        const totalVoters = new Set(Array.from(this.votes.values()).flat().map(v => v.voter)).size;
        const totalHolders = this.votingPower.size;
        return totalHolders > 0 ? (totalVoters / totalHolders) * 100 : 0;
    }

    private governanceConfig: GovernanceConfig = {
        proposalThreshold: '1000000',
        quorumThreshold: '10000000',
        votingDelay: 24 * 60 * 60,
        votingPeriod: 7 * 24 * 60 * 60,
        executionDelay: 2 * 24 * 60 * 60,
        gracePeriod: 14 * 24 * 60 * 60,
    };

    private proposalActions: Map<string, ProposalAction[]> = new Map();
}

// Additional interfaces for governance
interface Vote {
    id: string;
    proposalId: string;
    voter: string;
    support: 'for' | 'against' | 'abstain';
    weight: string;
    reason?: string;
    timestamp: Date;
    blockNumber: number;
}

interface VotingPower {
    address: string;
    tokens: string;
    nfts: string;
    delegated: string;
    total: string;
    lastUpdated: Date;
}

interface ProposalAction {
    type: 'changeParameter' | 'transferFunds' | 'updateContract' | 'addFeature';
    target: string;
    value: string;
    data?: string;
    description: string;
}

interface ActionExecutionResult {
    action: ProposalAction;
    success: boolean;
    result?: string;
    error?: string;
    timestamp: Date;
}

interface GovernanceConfig {
    proposalThreshold: string;
    quorumThreshold: string;
    votingDelay: number;
    votingPeriod: number;
    executionDelay: number;
    gracePeriod: number;
}

interface GovernanceStats {
    totalProposals: number;
    activeProposals: number;
    executedProposals: number;
    totalVotingPower: string;
    uniqueVoters: number;
    participationRate: number;
}
