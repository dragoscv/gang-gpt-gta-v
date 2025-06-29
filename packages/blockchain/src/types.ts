import { z } from 'zod';

// Blockchain configuration
export const BlockchainConfigSchema = z.object({
    network: z.enum(['mainnet', 'testnet', 'devnet']),
    solanaRpcUrl: z.string().url(),
    ethereumRpcUrl: z.string().url(),
    polygonRpcUrl: z.string().url(),
    contractAddresses: z.object({
        nftCollection: z.string(),
        tokenContract: z.string(),
        marketplace: z.string(),
        governance: z.string(),
    }),
});

export type BlockchainConfig = z.infer<typeof BlockchainConfigSchema>;

// NFT metadata structure
export const NFTMetadataSchema = z.object({
    name: z.string(),
    description: z.string(),
    image: z.string().url(),
    external_url: z.string().url().optional(),
    attributes: z.array(z.object({
        trait_type: z.string(),
        value: z.union([z.string(), z.number()]),
        display_type: z.string().optional(),
    })),
    properties: z.object({
        category: z.enum(['weapon', 'vehicle', 'property', 'collectible', 'utility']),
        rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']),
        gameStats: z.record(z.number()).optional(),
        transferable: z.boolean().default(true),
        sellable: z.boolean().default(true),
    }),
});

export type NFTMetadata = z.infer<typeof NFTMetadataSchema>;

// Player wallet information
export const PlayerWalletSchema = z.object({
    playerId: z.string(),
    walletAddress: z.string(),
    blockchain: z.enum(['solana', 'ethereum', 'polygon']),
    isVerified: z.boolean().default(false),
    connectedAt: z.date(),
    lastActivity: z.date(),
    nfts: z.array(z.object({
        tokenId: z.string(),
        contractAddress: z.string(),
        metadata: NFTMetadataSchema,
        acquiredAt: z.date(),
        isEquipped: z.boolean().default(false),
    })),
    tokens: z.array(z.object({
        symbol: z.string(),
        balance: z.string(), // Using string to handle large numbers
        decimals: z.number(),
        usdValue: z.number().optional(),
    })),
});

export type PlayerWallet = z.infer<typeof PlayerWalletSchema>;

// Marketplace listing
export const MarketplaceListingSchema = z.object({
    id: z.string(),
    tokenId: z.string(),
    contractAddress: z.string(),
    seller: z.string(),
    price: z.string(),
    currency: z.enum(['ETH', 'SOL', 'MATIC', 'GANG']),
    status: z.enum(['active', 'sold', 'cancelled', 'expired']),
    listedAt: z.date(),
    expiresAt: z.date().optional(),
    metadata: NFTMetadataSchema,
});

export type MarketplaceListing = z.infer<typeof MarketplaceListingSchema>;

// DAO governance proposal
export const GovernanceProposalSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    proposer: z.string(),
    proposalType: z.enum(['gameFeature', 'economicPolicy', 'serverRule', 'communityEvent']),
    votingPower: z.object({
        for: z.string(),
        against: z.string(),
        abstain: z.string(),
    }),
    status: z.enum(['pending', 'active', 'succeeded', 'defeated', 'executed']),
    createdAt: z.date(),
    votingStartsAt: z.date(),
    votingEndsAt: z.date(),
    executionDelay: z.number(), // in seconds
    quorumRequired: z.string(),
    votingThreshold: z.string(),
});

export type GovernanceProposal = z.infer<typeof GovernanceProposalSchema>;

// Transaction events
export const BlockchainTransactionSchema = z.object({
    id: z.string(),
    hash: z.string(),
    blockchain: z.enum(['solana', 'ethereum', 'polygon']),
    type: z.enum(['mint', 'transfer', 'sale', 'stake', 'vote', 'burn']),
    from: z.string(),
    to: z.string(),
    tokenId: z.string().optional(),
    amount: z.string().optional(),
    gasUsed: z.string(),
    gasPrice: z.string(),
    status: z.enum(['pending', 'confirmed', 'failed']),
    timestamp: z.date(),
    blockNumber: z.number(),
    metadata: z.record(z.any()).optional(),
});

export type BlockchainTransaction = z.infer<typeof BlockchainTransactionSchema>;

// Token economics
export const TokenEconomicsSchema = z.object({
    totalSupply: z.string(),
    circulatingSupply: z.string(),
    maxSupply: z.string(),
    holders: z.number(),
    marketCap: z.number(),
    price: z.object({
        usd: z.number(),
        eth: z.number(),
        btc: z.number(),
    }),
    volume24h: z.number(),
    priceChange24h: z.number(),
    stakingRewards: z.object({
        apr: z.number(),
        totalStaked: z.string(),
        rewardPool: z.string(),
    }),
});

export type TokenEconomics = z.infer<typeof TokenEconomicsSchema>;

// Game asset types
export interface GameAsset {
    id: string;
    name: string;
    category: 'weapon' | 'vehicle' | 'property' | 'collectible' | 'utility';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    stats: Record<string, number>;
    image: string;
    description: string;
    isNFT: boolean;
    nftTokenId?: string;
    contractAddress?: string;
    tradeable: boolean;
    sellable: boolean;
}

// Cross-chain bridge types
export interface CrossChainBridge {
    sourceChain: 'solana' | 'ethereum' | 'polygon';
    targetChain: 'solana' | 'ethereum' | 'polygon';
    tokenAddress: string;
    bridgeContract: string;
    fee: string;
    processingTime: number; // in minutes
    isActive: boolean;
}

// Smart contract interfaces
export interface SmartContractInterface {
    contractAddress: string;
    abi: any[];
    network: string;
    version: string;
    isUpgradeable: boolean;
    deployer: string;
    deployedAt: Date;
}

// Event types for blockchain integration
export type BlockchainEvent =
    | { type: 'NFT_MINTED'; payload: { tokenId: string; owner: string; metadata: NFTMetadata } }
    | { type: 'NFT_TRANSFERRED'; payload: { tokenId: string; from: string; to: string } }
    | { type: 'MARKETPLACE_LISTED'; payload: MarketplaceListing }
    | { type: 'MARKETPLACE_SOLD'; payload: { listingId: string; buyer: string; price: string } }
    | { type: 'GOVERNANCE_PROPOSAL_CREATED'; payload: GovernanceProposal }
    | { type: 'GOVERNANCE_VOTE_CAST'; payload: { proposalId: string; voter: string; vote: 'for' | 'against' | 'abstain'; weight: string } }
    | { type: 'TOKEN_STAKED'; payload: { staker: string; amount: string; duration: number } }
    | { type: 'REWARD_CLAIMED'; payload: { claimer: string; amount: string; type: 'staking' | 'gameplay' | 'achievement' } };

// Error types
export class BlockchainError extends Error {
    constructor(
        message: string,
        public code: string,
        public chainId?: string,
        public txHash?: string
    ) {
        super(message);
        this.name = 'BlockchainError';
    }
}

export class NFTError extends Error {
    constructor(
        message: string,
        public tokenId?: string,
        public contractAddress?: string
    ) {
        super(message);
        this.name = 'NFTError';
    }
}

export class MarketplaceError extends Error {
    constructor(
        message: string,
        public listingId?: string,
        public operation?: string
    ) {
        super(message);
        this.name = 'MarketplaceError';
    }
}
