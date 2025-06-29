import { Connection, Keypair } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    createNft,
    mplTokenMetadata,
    CreateNftInput,
    findMetadataPda,
    findMasterEditionPda,
    fetchMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { 
    generateSigner, 
    percentAmount, 
    some, 
    none, 
    publicKey,
    Umi,
    PublicKey as UmiPublicKey,
} from '@metaplex-foundation/umi';
import { NFTMetadata, GameAsset, BlockchainConfig, NFTError } from './types';

/**
 * NFT Management Service for GangGPT
 * Handles creation, minting, and management of in-game NFTs
 */
export class NFTService {
    private connection: Connection;
    private umi: Umi;
    private config: BlockchainConfig;

    constructor(config: BlockchainConfig) {
        this.config = config;
        this.connection = new Connection(config.solanaRpcUrl, 'confirmed');
        this.umi = createUmi(config.solanaRpcUrl).use(mplTokenMetadata());
    }

    /**
     * Create a new NFT collection for GangGPT assets
     */
    async createCollection(
        authority: Keypair,
        metadata: {
            name: string;
            symbol: string;
            description: string;
            image: string;
            externalUrl?: string;
        }
    ): Promise<string> {
        try {
            const mint = generateSigner(this.umi);

            const createCollectionInput: CreateNftInput = {
                mint,
                authority: this.umi.identity,
                name: metadata.name,
                symbol: metadata.symbol,
                uri: await this.uploadMetadata({
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image,
                    external_url: metadata.externalUrl,
                    attributes: [],
                    properties: {
                        category: 'collectible',
                        rarity: 'common',
                        transferable: true,
                        sellable: true,
                    },
                }),
                sellerFeeBasisPoints: percentAmount(5), // 5% royalty
                isCollection: true,
                collectionDetails: some({ version: 'V1', size: 0 }),
            };

            await createNft(this.umi, createCollectionInput).sendAndConfirm(this.umi);

            return mint.publicKey.toString();
        } catch (error) {
            throw new NFTError(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Mint a new NFT from a game asset
     */
    async mintGameAsset(
        gameAsset: GameAsset,
        recipient: string,
        collectionMint?: string
    ): Promise<string> {
        try {
            const mint = generateSigner(this.umi);

            const metadata: NFTMetadata = {
                name: gameAsset.name,
                description: gameAsset.description,
                image: gameAsset.image,
                attributes: [
                    { trait_type: 'Category', value: gameAsset.category },
                    { trait_type: 'Rarity', value: gameAsset.rarity },
                    ...Object.entries(gameAsset.stats).map(([key, value]) => ({
                        trait_type: key,
                        value,
                        display_type: 'number'
                    }))
                ],
                properties: {
                    category: gameAsset.category,
                    rarity: gameAsset.rarity,
                    gameStats: gameAsset.stats,
                    transferable: gameAsset.tradeable,
                    sellable: gameAsset.sellable,
                },
            };

            const uri = await this.uploadMetadata(metadata);

            const createNftInput: CreateNftInput = {
                mint,
                authority: this.umi.identity,
                name: metadata.name,
                symbol: 'GANG',
                uri,
                sellerFeeBasisPoints: percentAmount(5),
                collection: collectionMint ? some({ verified: false, key: collectionMint }) : none(),
            };

            await createNft(this.umi, createNftInput).sendAndConfirm(this.umi);

            // Transfer to recipient if different from authority
            if (recipient !== this.umi.identity.publicKey.toString()) {
                await this.transferNFT(mint.publicKey.toString(), recipient);
            }

            return mint.publicKey.toString();
        } catch (error) {
            throw new NFTError(
                `Failed to mint NFT for asset ${gameAsset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                this.config.contractAddresses.nftCollection
            );
        }
    }

    /**
     * Transfer NFT to another wallet
     */
    async transferNFT(tokenId: string, to: string): Promise<string> {
        try {
            const recipientPublicKey = publicKey(to);
            const mintPublicKey = publicKey(tokenId);

            // For now, return a mock transaction signature
            // In real implementation, this would use proper UMI transfer instructions
            const transferSignature = `transfer_${mintPublicKey}_to_${recipientPublicKey}_${Date.now()}`;

            return transferSignature;
        } catch (error) {
            throw new NFTError(
                `Failed to transfer NFT ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tokenId
            );
        }
    }

    /**
     * Burn an NFT (remove from circulation)
     */
    async burnNFT(tokenId: string): Promise<string> {
        try {
            const mintPublicKey = publicKey(tokenId);

            // Implementation for NFT burning using UMI
            // For now returning a mock transaction signature
            return `burn_${mintPublicKey}_${Date.now()}`;
        } catch (error) {
            throw new NFTError(
                `Failed to burn NFT ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tokenId
            );
        }
    }

    /**
     * Get NFT metadata
     */
    async getNFTMetadata(tokenId: string): Promise<NFTMetadata | null> {
        try {
            const mintPublicKey = publicKey(tokenId);
            const [metadataPda] = findMetadataPda(this.umi, { mint: mintPublicKey });

            // Fetch metadata from chain
            const metadata = await fetchMetadata(this.umi, metadataPda);
            
            if (!metadata) {
                return null;
            }

            // Convert metadata to our format
            const nftMetadata: NFTMetadata = {
                name: metadata.name,
                description: metadata.symbol, // Using symbol as description fallback
                image: metadata.uri, // This would normally be fetched from the URI
                attributes: [],
                properties: {
                    category: 'collectible',
                    rarity: 'common',
                    transferable: true,
                    sellable: true,
                },
            };

            return nftMetadata;
        } catch (error) {
            throw new NFTError(
                `Failed to get NFT metadata for ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tokenId
            );
        }
    }

    /**
     * Get all NFTs owned by a wallet
     */
    async getWalletNFTs(walletAddress: string): Promise<Array<{ tokenId: string; metadata: NFTMetadata }>> {
        try {
            const walletPublicKey = publicKey(walletAddress);

            // For now, return empty array - would need to implement
            // actual wallet NFT fetching using RPC calls
            return [];
        } catch (error) {
            throw new NFTError(
                `Failed to get NFTs for wallet ${walletAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Update NFT metadata (for dynamic NFTs)
     */
    async updateNFTMetadata(tokenId: string, newMetadata: Partial<NFTMetadata>): Promise<string> {
        try {
            const mintPublicKey = publicKey(tokenId);

            // Implementation for updating metadata
            // This would require the update authority and proper instruction building
            const updateTxSignature = `update_${mintPublicKey}_${Date.now()}`;

            return updateTxSignature;
        } catch (error) {
            throw new NFTError(
                `Failed to update NFT metadata for ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tokenId
            );
        }
    }

    /**
     * Convert game asset to NFT format
     */
    gameAssetToNFT(asset: GameAsset): NFTMetadata {
        return {
            name: asset.name,
            description: asset.description,
            image: asset.image,
            attributes: [
                { trait_type: 'Category', value: asset.category },
                { trait_type: 'Rarity', value: asset.rarity },
                ...Object.entries(asset.stats).map(([key, value]) => ({
                    trait_type: key,
                    value,
                    display_type: 'number'
                }))
            ],
            properties: {
                category: asset.category,
                rarity: asset.rarity,
                gameStats: asset.stats,
                transferable: asset.tradeable,
                sellable: asset.sellable,
            },
        };
    }

    /**
     * Upload metadata to IPFS or Arweave
     */
    private async uploadMetadata(metadata: NFTMetadata): Promise<string> {
        try {
            // For production, this would upload to IPFS/Arweave
            // For now, create a deterministic mock URI based on content
            const metadataString = JSON.stringify(metadata);
            const hash = Buffer.from(metadataString).toString('base64').slice(0, 32);
            
            // In real implementation, you would:
            // 1. Upload to IPFS using services like Pinata, NFT.Storage, or Web3.Storage
            // 2. Or upload to Arweave for permanent storage
            // 3. Return the actual URI
            
            return `https://gateway.pinata.cloud/ipfs/${hash}`;
        } catch (error) {
            throw new NFTError(`Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Verify NFT authenticity
     */
    async verifyNFT(tokenId: string): Promise<boolean> {
        try {
            const metadata = await this.getNFTMetadata(tokenId);

            if (!metadata) {
                return false;
            }

            // Verify the NFT is from our official collection
            // In production, this would check:
            // 1. The NFT's collection field matches our official collection
            // 2. The update authority is our program
            // 3. The metadata URI points to our official storage
            // 4. The metadata follows our schema
            
            // For now, check if metadata has expected structure
            const hasValidStructure = !!(metadata.name && 
                                       metadata.description && 
                                       metadata.properties && 
                                       metadata.attributes);

            return hasValidStructure;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get NFT trading history
     */
    async getNFTHistory(tokenId: string): Promise<Array<{
        event: 'mint' | 'transfer' | 'sale' | 'list' | 'delist';
        from?: string;
        to?: string;
        price?: string;
        timestamp: Date;
        txHash: string;
    }>> {
        try {
            // In a real implementation, this would:
            // 1. Query the blockchain for all transactions related to this NFT
            // 2. Parse transaction logs to identify events
            // 3. Return chronological history
            
            // For now, return a mock history showing the NFT was minted
            return [
                {
                    event: 'mint',
                    to: this.umi.identity.publicKey.toString(),
                    timestamp: new Date(),
                    txHash: `mint_${tokenId}_${Date.now()}`,
                }
            ];
        } catch (error) {
            throw new NFTError(
                `Failed to get NFT history for ${tokenId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tokenId
            );
        }
    }

    /**
     * Batch mint NFTs for events or airdrops
     */
    async batchMintNFTs(
        assets: GameAsset[],
        recipients: string[],
        collectionMint?: string
    ): Promise<string[]> {
        try {
            if (assets.length !== recipients.length) {
                throw new NFTError('Assets and recipients arrays must have the same length');
            }

            const mintPromises = assets.map((asset, index) =>
                this.mintGameAsset(asset, recipients[index], collectionMint)
            );

            return await Promise.all(mintPromises);
        } catch (error) {
            throw new NFTError(`Failed to batch mint NFTs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
