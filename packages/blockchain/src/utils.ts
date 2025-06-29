import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import { BlockchainConfig, BlockchainError, NFTError } from './types';

/**
 * Utility functions for blockchain operations
 */

/**
 * Validate blockchain addresses
 */
export function validateAddress(address: string, blockchain: 'solana' | 'ethereum' | 'polygon'): boolean {
    try {
        switch (blockchain) {
            case 'solana':
                new PublicKey(address);
                return true;
            case 'ethereum':
            case 'polygon':
                return ethers.isAddress(address);
            default:
                return false;
        }
    } catch {
        return false;
    }
}

/**
 * Format token amounts with proper decimals
 */
export function formatTokenAmount(amount: string | number, decimals: number = 18): string {
    const amountBN = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (amountBN / Math.pow(10, decimals)).toFixed(decimals);
}

/**
 * Parse token amounts to smallest unit
 */
export function parseTokenAmount(amount: string | number, decimals: number = 18): string {
    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Math.floor(amountNum * Math.pow(10, decimals)).toString();
}

/**
 * Generate unique transaction ID
 */
export function generateTransactionId(prefix: string = 'tx'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate mock transaction hash
 */
export function generateMockTxHash(): string {
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

/**
 * Calculate network fees
 */
export function calculateNetworkFees(
    gasUsed: string,
    gasPrice: string,
    blockchain: 'solana' | 'ethereum' | 'polygon'
): string {
    const gasUsedNum = parseFloat(gasUsed);
    const gasPriceNum = parseFloat(gasPrice);

    switch (blockchain) {
        case 'solana':
            // Solana uses lamports (1 SOL = 1e9 lamports)
            return (gasUsedNum * gasPriceNum * 1e9).toString();
        case 'ethereum':
        case 'polygon':
            // Ethereum/Polygon use wei (1 ETH = 1e18 wei)
            return (gasUsedNum * gasPriceNum * 1e18).toString();
        default:
            return '0';
    }
}

/**
 * Check transaction status
 */
export async function checkTransactionStatus(
    txHash: string,
    blockchain: 'solana' | 'ethereum' | 'polygon',
    rpcUrl: string
): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
        switch (blockchain) {
            case 'solana':
                const connection = new Connection(rpcUrl, 'confirmed');
                const status = await connection.getSignatureStatus(txHash);
                if (status.value?.confirmationStatus === 'confirmed') {
                    return 'confirmed';
                } else if (status.value?.err) {
                    return 'failed';
                }
                return 'pending';

            case 'ethereum':
            case 'polygon':
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const receipt = await provider.getTransactionReceipt(txHash);
                if (receipt) {
                    return receipt.status === 1 ? 'confirmed' : 'failed';
                }
                return 'pending';

            default:
                throw new BlockchainError('Unsupported blockchain', 'UNSUPPORTED_BLOCKCHAIN');
        }
    } catch (error) {
        throw new BlockchainError(
            `Failed to check transaction status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'TRANSACTION_STATUS_CHECK_FAILED',
            blockchain,
            txHash
        );
    }
}

/**
 * Estimate gas for transaction
 */
export async function estimateGas(
    transaction: any,
    blockchain: 'solana' | 'ethereum' | 'polygon',
    rpcUrl: string
): Promise<string> {
    try {
        switch (blockchain) {
            case 'solana':
                // Solana transactions have fixed fees
                return '0.000005'; // 5000 lamports

            case 'ethereum':
            case 'polygon':
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const gasEstimate = await provider.estimateGas(transaction);
                return gasEstimate.toString();

            default:
                throw new BlockchainError('Unsupported blockchain', 'UNSUPPORTED_BLOCKCHAIN');
        }
    } catch (error) {
        throw new BlockchainError(
            `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'GAS_ESTIMATION_FAILED',
            blockchain
        );
    }
}

/**
 * Get current gas price
 */
export async function getCurrentGasPrice(
    blockchain: 'solana' | 'ethereum' | 'polygon',
    rpcUrl: string
): Promise<string> {
    try {
        switch (blockchain) {
            case 'solana':
                // Solana has fixed gas prices
                return '0.000000001'; // 1 lamport per compute unit

            case 'ethereum':
            case 'polygon':
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const feeData = await provider.getFeeData();
                return feeData.gasPrice?.toString() || '0';

            default:
                throw new BlockchainError('Unsupported blockchain', 'UNSUPPORTED_BLOCKCHAIN');
        }
    } catch (error) {
        throw new BlockchainError(
            `Failed to get gas price: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'GAS_PRICE_FETCH_FAILED',
            blockchain
        );
    }
}

/**
 * Convert between different token standards
 */
export function convertTokenStandard(
    metadata: any,
    fromStandard: 'ERC721' | 'SPL' | 'ERC1155',
    toStandard: 'ERC721' | 'SPL' | 'ERC1155'
): any {
    if (fromStandard === toStandard) {
        return metadata;
    }

    // Base metadata structure that works across standards
    const baseMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.external_url,
        attributes: metadata.attributes || [],
    };

    switch (toStandard) {
        case 'ERC721':
            return {
                ...baseMetadata,
                background_color: metadata.background_color,
                animation_url: metadata.animation_url,
                youtube_url: metadata.youtube_url,
            };

        case 'SPL':
            return {
                ...baseMetadata,
                symbol: metadata.symbol || 'GANG',
                seller_fee_basis_points: metadata.seller_fee_basis_points || 500,
                properties: {
                    creators: metadata.properties?.creators || [],
                    category: metadata.properties?.category || 'image',
                },
            };

        case 'ERC1155':
            return {
                ...baseMetadata,
                decimals: metadata.decimals || 0,
            };

        default:
            return baseMetadata;
    }
}

/**
 * Validate NFT metadata
 */
export function validateNFTMetadata(metadata: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metadata.name || typeof metadata.name !== 'string') {
        errors.push('Name is required and must be a string');
    }

    if (!metadata.description || typeof metadata.description !== 'string') {
        errors.push('Description is required and must be a string');
    }

    if (!metadata.image || typeof metadata.image !== 'string') {
        errors.push('Image is required and must be a string');
    }

    if (metadata.image && !isValidUrl(metadata.image)) {
        errors.push('Image must be a valid URL');
    }

    if (metadata.external_url && !isValidUrl(metadata.external_url)) {
        errors.push('External URL must be a valid URL');
    }

    if (metadata.attributes && !Array.isArray(metadata.attributes)) {
        errors.push('Attributes must be an array');
    }

    if (metadata.attributes) {
        metadata.attributes.forEach((attr: any, index: number) => {
            if (!attr.trait_type || typeof attr.trait_type !== 'string') {
                errors.push(`Attribute ${index}: trait_type is required and must be a string`);
            }
            if (attr.value === undefined || attr.value === null) {
                errors.push(`Attribute ${index}: value is required`);
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Generate IPFS metadata URI
 */
export function generateIPFSUri(hash: string): string {
    return `ipfs://${hash}`;
}

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(ipfsUri: string, gateway: string = 'https://gateway.pinata.cloud'): string {
    if (!ipfsUri.startsWith('ipfs://')) {
        return ipfsUri;
    }

    const hash = ipfsUri.replace('ipfs://', '');
    return `${gateway}/ipfs/${hash}`;
}

/**
 * Calculate trading fees
 */
export function calculateTradingFees(
    price: string,
    tradingFeePercent: number = 2.5,
    royaltyFeePercent: number = 5
): {
    tradingFee: string;
    royaltyFee: string;
    netAmount: string;
} {
    const priceNum = parseFloat(price);
    const tradingFee = priceNum * (tradingFeePercent / 100);
    const royaltyFee = priceNum * (royaltyFeePercent / 100);
    const netAmount = priceNum - tradingFee - royaltyFee;

    return {
        tradingFee: tradingFee.toString(),
        royaltyFee: royaltyFee.toString(),
        netAmount: netAmount.toString(),
    };
}

/**
 * Generate rarity score for NFT
 */
export function calculateRarityScore(
    attributes: Array<{ trait_type: string; value: string | number }>,
    collectionStats: Record<string, Record<string, number>>
): number {
    let rarityScore = 0;

    for (const attribute of attributes) {
        const traitStats = collectionStats[attribute.trait_type];
        if (traitStats) {
            const traitCount = traitStats[attribute.value.toString()] || 0;
            const totalItems = Object.values(traitStats).reduce((sum, count) => sum + count, 0);
            const traitRarity = totalItems > 0 ? traitCount / totalItems : 0;
            rarityScore += traitRarity > 0 ? 1 / traitRarity : 0;
        }
    }

    return Math.round(rarityScore * 100) / 100;
}

/**
 * Batch process blockchain operations
 */
export async function batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10,
    delayMs: number = 100
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(processor);
        const batchResults = await Promise.allSettled(batchPromises);

        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                console.error('Batch processing error:', result.reason);
            }
        }

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < items.length && delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

/**
 * Retry blockchain operations with exponential backoff
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            if (attempt === maxRetries) {
                break;
            }

            const delay = initialDelayMs * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new BlockchainError(
        `Operation failed after ${maxRetries} retries: ${lastError.message}`,
        'RETRY_EXHAUSTED'
    );
}

/**
 * Monitor blockchain events
 */
export class BlockchainEventMonitor {
    private listeners: Map<string, Array<(event: any) => void>> = new Map();
    private isMonitoring: boolean = false;

    constructor(private config: BlockchainConfig) { }

    on(eventType: string, callback: (event: any) => void): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)!.push(callback);
    }

    off(eventType: string, callback: (event: any) => void): void {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(eventType: string, event: any): void {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    console.error(`Error in event callback for ${eventType}:`, error);
                }
            });
        }
    }

    async startMonitoring(): Promise<void> {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;

        // Mock event monitoring - in real implementation would listen to blockchain events
        const mockEventInterval = setInterval(() => {
            if (!this.isMonitoring) {
                clearInterval(mockEventInterval);
                return;
            }

            // Emit mock events for testing
            const eventTypes = ['Transfer', 'Sale', 'Mint', 'Burn'];
            const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];

            this.emit(randomEvent, {
                type: randomEvent,
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                txHash: generateMockTxHash(),
            });
        }, 5000); // Emit mock event every 5 seconds
    }

    stopMonitoring(): void {
        this.isMonitoring = false;
    }
}

// Helper functions
function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

/**
 * Cross-chain bridge utilities
 */
export class CrossChainBridge {
    constructor(private config: BlockchainConfig) { }

    async bridgeToken(
        fromChain: 'solana' | 'ethereum' | 'polygon',
        toChain: 'solana' | 'ethereum' | 'polygon',
        tokenAddress: string,
        amount: string,
        recipient: string
    ): Promise<string> {
        // Mock implementation for cross-chain bridging
        const bridgeId = generateTransactionId('bridge');

        // In real implementation, this would:
        // 1. Lock tokens on source chain
        // 2. Verify lock transaction
        // 3. Mint equivalent tokens on destination chain
        // 4. Handle any necessary wrapping/unwrapping

        return bridgeId;
    }

    async getBridgeFee(
        fromChain: 'solana' | 'ethereum' | 'polygon',
        toChain: 'solana' | 'ethereum' | 'polygon',
        amount: string
    ): Promise<string> {
        // Mock fee calculation
        const baseAmount = parseFloat(amount);
        const feePercent = 0.1; // 0.1%
        return (baseAmount * (feePercent / 100)).toString();
    }

    async getBridgeStatus(bridgeId: string): Promise<'pending' | 'confirmed' | 'failed'> {
        // Mock status check
        return 'confirmed';
    }
}
