import { EventEmitter } from 'events';
import { z } from 'zod';
import {
    TokenEconomics,
    PlayerWallet,
    BlockchainTransaction,
    BlockchainConfig,
    BlockchainError
} from './types';

/**
 * Player-Owned Economy Service
 * Manages the DeFi aspects of the GangGPT ecosystem
 */
export class EconomyService extends EventEmitter {
    private config: BlockchainConfig;
    private stakingPools: Map<string, StakingPool> = new Map();
    private liquidityPools: Map<string, LiquidityPool> = new Map();
    private yieldFarms: Map<string, YieldFarm> = new Map();

    constructor(config: BlockchainConfig) {
        super();
        this.config = config;
        this.initializeEconomy();
    }

    /**
     * Initialize the economy with default pools and farms
     */
    private async initializeEconomy(): Promise<void> {
        // Create default staking pools
        await this.createStakingPool({
            id: 'gang-main',
            tokenSymbol: 'GANG',
            apr: 12.5,
            lockPeriod: 0, // Flexible staking
            minStake: '100',
            maxStake: '1000000',
            rewardToken: 'GANG',
        });

        await this.createStakingPool({
            id: 'gang-locked-30',
            tokenSymbol: 'GANG',
            apr: 25.0,
            lockPeriod: 30 * 24 * 60 * 60, // 30 days
            minStake: '1000',
            maxStake: '10000000',
            rewardToken: 'GANG',
        });

        // Create liquidity pools
        await this.createLiquidityPool({
            id: 'gang-sol',
            token0: 'GANG',
            token1: 'SOL',
            fee: 0.003, // 0.3%
            rewards: ['GANG', 'SOL'],
        });

        await this.createLiquidityPool({
            id: 'gang-usdc',
            token0: 'GANG',
            token1: 'USDC',
            fee: 0.0025, // 0.25%
            rewards: ['GANG'],
        });
    }

    /**
     * Stake tokens for rewards
     */
    async stakeTokens(
        playerId: string,
        poolId: string,
        amount: string,
        duration?: number
    ): Promise<string> {
        try {
            const pool = this.stakingPools.get(poolId);
            if (!pool) {
                throw new BlockchainError(`Staking pool ${poolId} not found`, 'POOL_NOT_FOUND');
            }

            // Validate staking amount
            const stakeAmount = parseFloat(amount);
            if (stakeAmount < parseFloat(pool.minStake)) {
                throw new BlockchainError(`Minimum stake is ${pool.minStake}`, 'INSUFFICIENT_STAKE');
            }

            if (stakeAmount > parseFloat(pool.maxStake)) {
                throw new BlockchainError(`Maximum stake is ${pool.maxStake}`, 'EXCESSIVE_STAKE');
            }

            // Create staking transaction
            const transaction: BlockchainTransaction = {
                id: `stake_${Date.now()}_${playerId}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'stake',
                from: playerId,
                to: pool.contractAddress || this.config.contractAddresses.tokenContract,
                amount,
                gasUsed: '0.001',
                gasPrice: '0.000005',
                status: 'pending',
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    poolId,
                    duration: duration || pool.lockPeriod,
                    expectedApr: pool.apr,
                },
            };

            // Update pool statistics
            pool.totalStaked = (parseFloat(pool.totalStaked) + stakeAmount).toString();
            pool.stakerCount += 1;

            // Calculate rewards
            const stakingPosition: StakingPosition = {
                id: transaction.id,
                playerId,
                poolId,
                amount,
                startTime: new Date(),
                lockPeriod: duration || pool.lockPeriod,
                apr: pool.apr,
                rewardsEarned: '0',
                isActive: true,
            };

            // Store staking position
            if (!pool.positions) pool.positions = [];
            pool.positions.push(stakingPosition);

            this.emit('tokensStaked', {
                playerId,
                poolId,
                amount,
                duration: stakingPosition.lockPeriod,
                transaction,
            });

            return transaction.id;
        } catch (error) {
            throw new BlockchainError(
                `Failed to stake tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'STAKING_FAILED'
            );
        }
    }

    /**
     * Unstake tokens and claim rewards
     */
    async unstakeTokens(playerId: string, stakingId: string): Promise<string> {
        try {
            let stakingPosition: StakingPosition | undefined;
            let pool: StakingPool | undefined;

            // Find the staking position
            for (const [poolId, stakingPool] of this.stakingPools) {
                const position = stakingPool.positions?.find(p => p.id === stakingId && p.playerId === playerId);
                if (position) {
                    stakingPosition = position;
                    pool = stakingPool;
                    break;
                }
            }

            if (!stakingPosition || !pool) {
                throw new BlockchainError('Staking position not found', 'POSITION_NOT_FOUND');
            }

            // Check if lock period has passed
            const now = new Date();
            const lockEndTime = new Date(stakingPosition.startTime.getTime() + stakingPosition.lockPeriod * 1000);

            if (now < lockEndTime && stakingPosition.lockPeriod > 0) {
                throw new BlockchainError('Tokens are still locked', 'TOKENS_LOCKED');
            }

            // Calculate final rewards
            const timeStaked = (now.getTime() - stakingPosition.startTime.getTime()) / 1000; // seconds
            const yearsStaked = timeStaked / (365 * 24 * 60 * 60);
            const rewards = parseFloat(stakingPosition.amount) * (stakingPosition.apr / 100) * yearsStaked;

            // Create unstaking transaction
            const transaction: BlockchainTransaction = {
                id: `unstake_${Date.now()}_${playerId}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'transfer',
                from: pool.contractAddress || this.config.contractAddresses.tokenContract,
                to: playerId,
                amount: (parseFloat(stakingPosition.amount) + rewards).toString(),
                gasUsed: '0.001',
                gasPrice: '0.000005',
                status: 'pending',
                timestamp: now,
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    stakingId,
                    principal: stakingPosition.amount,
                    rewards: rewards.toString(),
                    timeStaked,
                },
            };

            // Update pool and position
            pool.totalStaked = (parseFloat(pool.totalStaked) - parseFloat(stakingPosition.amount)).toString();
            pool.stakerCount -= 1;
            stakingPosition.isActive = false;
            stakingPosition.rewardsEarned = rewards.toString();

            this.emit('tokensUnstaked', {
                playerId,
                stakingId,
                principal: stakingPosition.amount,
                rewards: rewards.toString(),
                transaction,
            });

            return transaction.id;
        } catch (error) {
            throw new BlockchainError(
                `Failed to unstake tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'UNSTAKING_FAILED'
            );
        }
    }

    /**
     * Provide liquidity to a pool
     */
    async provideLiquidity(
        playerId: string,
        poolId: string,
        token0Amount: string,
        token1Amount: string
    ): Promise<string> {
        try {
            const pool = this.liquidityPools.get(poolId);
            if (!pool) {
                throw new BlockchainError(`Liquidity pool ${poolId} not found`, 'POOL_NOT_FOUND');
            }

            // Calculate LP tokens to mint
            const lpTokens = this.calculateLPTokens(pool, token0Amount, token1Amount);

            const transaction: BlockchainTransaction = {
                id: `lp_add_${Date.now()}_${playerId}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'transfer',
                from: playerId,
                to: pool.contractAddress,
                gasUsed: '0.002',
                gasPrice: '0.000005',
                status: 'pending',
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    poolId,
                    token0: pool.token0,
                    token1: pool.token1,
                    token0Amount,
                    token1Amount,
                    lpTokens: lpTokens.toString(),
                },
            };

            // Update pool liquidity
            pool.token0Reserve = (parseFloat(pool.token0Reserve) + parseFloat(token0Amount)).toString();
            pool.token1Reserve = (parseFloat(pool.token1Reserve) + parseFloat(token1Amount)).toString();
            pool.totalLiquidity = (parseFloat(pool.totalLiquidity) + lpTokens).toString();

            this.emit('liquidityProvided', {
                playerId,
                poolId,
                token0Amount,
                token1Amount,
                lpTokens,
                transaction,
            });

            return transaction.id;
        } catch (error) {
            throw new BlockchainError(
                `Failed to provide liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LIQUIDITY_FAILED'
            );
        }
    }

    /**
     * Remove liquidity from a pool
     */
    async removeLiquidity(
        playerId: string,
        poolId: string,
        lpTokenAmount: string
    ): Promise<string> {
        try {
            const pool = this.liquidityPools.get(poolId);
            if (!pool) {
                throw new BlockchainError(`Liquidity pool ${poolId} not found`, 'POOL_NOT_FOUND');
            }

            // Calculate tokens to return
            const { token0Amount, token1Amount } = this.calculateTokensFromLP(pool, lpTokenAmount);

            const transaction: BlockchainTransaction = {
                id: `lp_remove_${Date.now()}_${playerId}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'transfer',
                from: pool.contractAddress,
                to: playerId,
                gasUsed: '0.002',
                gasPrice: '0.000005',
                status: 'pending',
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    poolId,
                    lpTokensBurned: lpTokenAmount,
                    token0Returned: token0Amount,
                    token1Returned: token1Amount,
                },
            };

            // Update pool liquidity
            pool.token0Reserve = (parseFloat(pool.token0Reserve) - parseFloat(token0Amount)).toString();
            pool.token1Reserve = (parseFloat(pool.token1Reserve) - parseFloat(token1Amount)).toString();
            pool.totalLiquidity = (parseFloat(pool.totalLiquidity) - parseFloat(lpTokenAmount)).toString();

            this.emit('liquidityRemoved', {
                playerId,
                poolId,
                lpTokenAmount,
                token0Amount,
                token1Amount,
                transaction,
            });

            return transaction.id;
        } catch (error) {
            throw new BlockchainError(
                `Failed to remove liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LIQUIDITY_REMOVAL_FAILED'
            );
        }
    }

    /**
     * Swap tokens in a liquidity pool
     */
    async swapTokens(
        playerId: string,
        poolId: string,
        tokenIn: string,
        amountIn: string,
        tokenOut: string,
        minAmountOut: string
    ): Promise<string> {
        try {
            const pool = this.liquidityPools.get(poolId);
            if (!pool) {
                throw new BlockchainError(`Liquidity pool ${poolId} not found`, 'POOL_NOT_FOUND');
            }

            // Calculate swap output using constant product formula
            const amountOut = this.calculateSwapOutput(pool, tokenIn, amountIn, tokenOut);

            if (parseFloat(amountOut) < parseFloat(minAmountOut)) {
                throw new BlockchainError('Slippage tolerance exceeded', 'SLIPPAGE_EXCEEDED');
            }

            const transaction: BlockchainTransaction = {
                id: `swap_${Date.now()}_${playerId}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'transfer',
                from: playerId,
                to: pool.contractAddress,
                gasUsed: '0.0015',
                gasPrice: '0.000005',
                status: 'pending',
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    poolId,
                    tokenIn,
                    tokenOut,
                    amountIn,
                    amountOut,
                    fee: (parseFloat(amountIn) * pool.fee).toString(),
                },
            };

            // Update pool reserves
            if (tokenIn === pool.token0) {
                pool.token0Reserve = (parseFloat(pool.token0Reserve) + parseFloat(amountIn)).toString();
                pool.token1Reserve = (parseFloat(pool.token1Reserve) - parseFloat(amountOut)).toString();
            } else {
                pool.token1Reserve = (parseFloat(pool.token1Reserve) + parseFloat(amountIn)).toString();
                pool.token0Reserve = (parseFloat(pool.token0Reserve) - parseFloat(amountOut)).toString();
            }

            this.emit('tokensSwapped', {
                playerId,
                poolId,
                tokenIn,
                tokenOut,
                amountIn,
                amountOut,
                transaction,
            });

            return transaction.id;
        } catch (error) {
            throw new BlockchainError(
                `Failed to swap tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SWAP_FAILED'
            );
        }
    }

    /**
     * Get player's staking positions
     */
    getPlayerStakingPositions(playerId: string): StakingPosition[] {
        const positions: StakingPosition[] = [];

        for (const pool of this.stakingPools.values()) {
            if (pool.positions) {
                positions.push(...pool.positions.filter(p => p.playerId === playerId && p.isActive));
            }
        }

        return positions;
    }

    /**
     * Get current token economics data
     */
    async getTokenEconomics(): Promise<TokenEconomics> {
        // This would typically fetch from blockchain or price feeds
        return {
            totalSupply: '1000000000',
            circulatingSupply: '500000000',
            maxSupply: '1000000000',
            holders: 25000,
            marketCap: 50000000,
            price: {
                usd: 0.10,
                eth: 0.000034,
                btc: 0.0000023,
            },
            volume24h: 2500000,
            priceChange24h: 5.67,
            stakingRewards: {
                apr: 12.5,
                totalStaked: '100000000',
                rewardPool: '50000000',
            },
        };
    }

    /**
     * Create a new staking pool
     */
    private async createStakingPool(config: StakingPoolConfig): Promise<void> {
        const pool: StakingPool = {
            id: config.id,
            tokenSymbol: config.tokenSymbol,
            contractAddress: this.config.contractAddresses.tokenContract,
            apr: config.apr,
            lockPeriod: config.lockPeriod,
            minStake: config.minStake,
            maxStake: config.maxStake,
            totalStaked: '0',
            stakerCount: 0,
            rewardToken: config.rewardToken,
            positions: [],
        };

        this.stakingPools.set(config.id, pool);
    }

    /**
     * Create a new liquidity pool
     */
    private async createLiquidityPool(config: LiquidityPoolConfig): Promise<void> {
        const pool: LiquidityPool = {
            id: config.id,
            token0: config.token0,
            token1: config.token1,
            token0Reserve: '1000000',
            token1Reserve: '1000000',
            totalLiquidity: '1000000',
            fee: config.fee,
            contractAddress: this.config.contractAddresses.marketplace,
            rewards: config.rewards,
        };

        this.liquidityPools.set(config.id, pool);
    }

    // Helper methods for calculations
    private calculateLPTokens(pool: LiquidityPool, token0Amount: string, token1Amount: string): number {
        // Simplified LP token calculation
        const liquidity0 = parseFloat(token0Amount) / parseFloat(pool.token0Reserve);
        const liquidity1 = parseFloat(token1Amount) / parseFloat(pool.token1Reserve);
        return Math.min(liquidity0, liquidity1) * parseFloat(pool.totalLiquidity);
    }

    private calculateTokensFromLP(pool: LiquidityPool, lpTokenAmount: string): { token0Amount: string; token1Amount: string } {
        const share = parseFloat(lpTokenAmount) / parseFloat(pool.totalLiquidity);
        return {
            token0Amount: (share * parseFloat(pool.token0Reserve)).toString(),
            token1Amount: (share * parseFloat(pool.token1Reserve)).toString(),
        };
    }

    private calculateSwapOutput(pool: LiquidityPool, tokenIn: string, amountIn: string, tokenOut: string): string {
        // Constant product formula: x * y = k
        const reserveIn = tokenIn === pool.token0 ? parseFloat(pool.token0Reserve) : parseFloat(pool.token1Reserve);
        const reserveOut = tokenOut === pool.token0 ? parseFloat(pool.token0Reserve) : parseFloat(pool.token1Reserve);

        const amountInWithFee = parseFloat(amountIn) * (1 - pool.fee);
        const amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

        return amountOut.toString();
    }
}

// Additional interfaces for economy system
interface StakingPoolConfig {
    id: string;
    tokenSymbol: string;
    apr: number;
    lockPeriod: number; // in seconds
    minStake: string;
    maxStake: string;
    rewardToken: string;
}

interface StakingPool {
    id: string;
    tokenSymbol: string;
    contractAddress: string;
    apr: number;
    lockPeriod: number;
    minStake: string;
    maxStake: string;
    totalStaked: string;
    stakerCount: number;
    rewardToken: string;
    positions?: StakingPosition[];
}

interface StakingPosition {
    id: string;
    playerId: string;
    poolId: string;
    amount: string;
    startTime: Date;
    lockPeriod: number;
    apr: number;
    rewardsEarned: string;
    isActive: boolean;
}

interface LiquidityPoolConfig {
    id: string;
    token0: string;
    token1: string;
    fee: number;
    rewards: string[];
}

interface LiquidityPool {
    id: string;
    token0: string;
    token1: string;
    token0Reserve: string;
    token1Reserve: string;
    totalLiquidity: string;
    fee: number;
    contractAddress: string;
    rewards: string[];
}

interface YieldFarm {
    id: string;
    lpToken: string;
    rewardTokens: string[];
    apr: number;
    totalStaked: string;
    farmersCount: number;
}
