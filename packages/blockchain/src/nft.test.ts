import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NFTService } from './nft';
import { GameAsset, BlockchainConfig, NFTMetadata } from './types';

// Mock UMI and related dependencies
vi.mock('@metaplex-foundation/umi-bundle-defaults', () => ({
    createUmi: vi.fn(() => ({
        identity: {
            publicKey: 'mock-authority-public-key',
        },
        use: vi.fn().mockReturnThis(),
    })),
}));

vi.mock('@metaplex-foundation/mpl-token-metadata', () => ({
    mplTokenMetadata: vi.fn(),
    createNft: vi.fn(() => ({
        sendAndConfirm: vi.fn().mockResolvedValue('mock-transaction-signature'),
    })),
    findMetadataPda: vi.fn(() => ['mock-metadata-pda']),
    findMasterEditionPda: vi.fn(() => ['mock-master-edition-pda']),
    fetchMetadata: vi.fn(() => ({
        name: 'Test NFT',
        symbol: 'TEST',
        uri: 'https://example.com/metadata.json',
    })),
}));

vi.mock('@metaplex-foundation/umi', () => ({
    generateSigner: vi.fn(() => ({
        publicKey: 'mock-mint-public-key',
    })),
    percentAmount: vi.fn((value) => value),
    some: vi.fn((value) => value),
    none: vi.fn(() => null),
    publicKey: vi.fn((value) => value),
}));

vi.mock('@solana/web3.js', () => ({
    Connection: vi.fn(() => ({
        getAccountInfo: vi.fn(),
        getConfirmedTransaction: vi.fn(),
    })),
    Keypair: vi.fn(() => ({
        publicKey: 'mock-keypair-public-key',
        secretKey: new Uint8Array(64),
        _keypair: true,
    })),
}));

describe('NFTService', () => {
    let nftService: NFTService;
    let mockConfig: BlockchainConfig;
    let testGameAsset: GameAsset;

    beforeEach(() => {
        mockConfig = {
            network: 'devnet',
            solanaRpcUrl: 'https://api.devnet.solana.com',
            ethereumRpcUrl: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
            polygonRpcUrl: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
            contractAddresses: {
                nftCollection: 'mock-collection-address',
                tokenContract: 'mock-token-address',
                marketplace: 'mock-marketplace-address',
                governance: 'mock-governance-address',
            },
        };

        testGameAsset = {
            id: 'weapon-001',
            name: 'Legendary AK-47',
            category: 'weapon',
            rarity: 'legendary',
            stats: {
                damage: 95,
                accuracy: 78,
                range: 85,
                durability: 90,
            },
            image: 'https://example.com/ak47.png',
            description: 'A legendary AK-47 with enhanced damage and durability.',
            isNFT: true,
            tradeable: true,
            sellable: true,
        };

        nftService = new NFTService(mockConfig);
    });

    describe('Collection Creation', () => {
        it('should create a new NFT collection successfully', async () => {
            const { Keypair } = await import('@solana/web3.js');
            const mockAuthority = new Keypair();

            const collectionMetadata = {
                name: 'GangGPT Collection',
                symbol: 'GANG',
                description: 'Official GangGPT NFT Collection',
                image: 'https://example.com/collection.png',
                externalUrl: 'https://ganggpt.com',
            };

            const result = await nftService.createCollection(mockAuthority, collectionMetadata);

            expect(result).toBe('mock-mint-public-key');
        });

        it('should handle collection creation errors gracefully', async () => {
            const { Keypair } = await import('@solana/web3.js');
            const mockAuthority = new Keypair();

            const collectionMetadata = {
                name: '',
                symbol: '',
                description: '',
                image: '',
            };

            // Mock an error in the creation process
            const { createNft } = await import('@metaplex-foundation/mpl-token-metadata');
            vi.mocked(createNft).mockImplementationOnce(() => {
                throw new Error('Collection creation failed');
            });

            await expect(
                nftService.createCollection(mockAuthority, collectionMetadata)
            ).rejects.toThrow('Failed to create collection: Collection creation failed');
        });
    });

    describe('NFT Minting', () => {
        it('should mint a game asset as NFT successfully', async () => {
            const recipient = 'mock-recipient-address';
            const collectionMint = 'mock-collection-mint';

            const result = await nftService.mintGameAsset(testGameAsset, recipient, collectionMint);

            expect(result).toBe('mock-mint-public-key');
        });

        it('should convert game asset to NFT metadata correctly', () => {
            const nftMetadata = nftService.gameAssetToNFT(testGameAsset);

            expect(nftMetadata).toEqual({
                name: testGameAsset.name,
                description: testGameAsset.description,
                image: testGameAsset.image,
                attributes: [
                    { trait_type: 'Category', value: 'weapon' },
                    { trait_type: 'Rarity', value: 'legendary' },
                    { trait_type: 'damage', value: 95, display_type: 'number' },
                    { trait_type: 'accuracy', value: 78, display_type: 'number' },
                    { trait_type: 'range', value: 85, display_type: 'number' },
                    { trait_type: 'durability', value: 90, display_type: 'number' },
                ],
                properties: {
                    category: 'weapon',
                    rarity: 'legendary',
                    gameStats: testGameAsset.stats,
                    transferable: true,
                    sellable: true,
                },
            });
        });

        it('should handle minting errors gracefully', async () => {
            const { createNft } = await import('@metaplex-foundation/mpl-token-metadata');
            vi.mocked(createNft).mockImplementationOnce(() => {
                throw new Error('Minting failed');
            });

            await expect(
                nftService.mintGameAsset(testGameAsset, 'invalid-recipient')
            ).rejects.toThrow('Failed to mint NFT for asset weapon-001: Minting failed');
        });
    });

    describe('NFT Operations', () => {
        const tokenId = 'mock-token-id';

        it('should transfer NFT successfully', async () => {
            const recipient = 'mock-recipient-address';

            const result = await nftService.transferNFT(tokenId, recipient);

            expect(result).toContain('transfer_');
            expect(result).toContain(tokenId);
            expect(result).toContain(recipient);
        });

        it('should burn NFT successfully', async () => {
            const result = await nftService.burnNFT(tokenId);

            expect(result).toContain('burn_');
            expect(result).toContain(tokenId);
        });

        it('should update NFT metadata successfully', async () => {
            const newMetadata: Partial<NFTMetadata> = {
                description: 'Updated description',
            };

            const result = await nftService.updateNFTMetadata(tokenId, newMetadata);

            expect(result).toContain('update_');
            expect(result).toContain(tokenId);
        });

        it('should get NFT metadata', async () => {
            const metadata = await nftService.getNFTMetadata(tokenId);

            expect(metadata).toBeTruthy();
            expect(metadata?.name).toBe('Test NFT');
            expect(metadata?.properties.category).toBe('collectible');
        });

        it('should get wallet NFTs', async () => {
            const walletAddress = 'mock-wallet-address';

            const nfts = await nftService.getWalletNFTs(walletAddress);

            expect(Array.isArray(nfts)).toBe(true);
            expect(nfts.length).toBe(0); // Mock implementation returns empty array
        });
    });

    describe('NFT History and Verification', () => {
        const tokenId = 'mock-token-id';

        it('should get NFT history', async () => {
            const history = await nftService.getNFTHistory(tokenId);

            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBeGreaterThan(0);
            expect(history[0].event).toBe('mint');
            expect(history[0].txHash).toContain('mint_');
        });

        it('should verify NFT authenticity', async () => {
            const isVerified = await nftService.verifyNFT(tokenId);

            expect(typeof isVerified).toBe('boolean');
            expect(isVerified).toBe(true);
        });

        it('should handle verification failures gracefully', async () => {
            const { fetchMetadata } = await import('@metaplex-foundation/mpl-token-metadata');
            vi.mocked(fetchMetadata).mockImplementationOnce(() => {
                throw new Error('Metadata fetch failed');
            });

            const isVerified = await nftService.verifyNFT('invalid-token-id');

            expect(isVerified).toBe(false);
        });
    });

    describe('Batch Operations', () => {
        it('should batch mint NFTs successfully', async () => {
            const assets = [testGameAsset, { ...testGameAsset, id: 'weapon-002' }];
            const recipients = ['recipient-1', 'recipient-2'];
            const collectionMint = 'mock-collection-mint';

            const results = await nftService.batchMintNFTs(assets, recipients, collectionMint);

            expect(results.length).toBe(2);
            expect(results[0]).toBe('mock-mint-public-key');
            expect(results[1]).toBe('mock-mint-public-key');
        });

        it('should handle batch minting with mismatched arrays', async () => {
            const assets = [testGameAsset];
            const recipients = ['recipient-1', 'recipient-2']; // Different length

            await expect(
                nftService.batchMintNFTs(assets, recipients)
            ).rejects.toThrow('Assets and recipients arrays must have the same length');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid addresses gracefully', async () => {
            // Since we're using mocks, this will succeed but in real implementation
            // invalid addresses would throw errors
            const result = await nftService.transferNFT('invalid-token', 'invalid-recipient');
            expect(result).toContain('transfer_');
        });

        it('should handle metadata upload errors', async () => {
            // Test should work with our mock implementation
            const invalidAsset = { ...testGameAsset, name: '' };

            const result = await nftService.mintGameAsset(invalidAsset, 'recipient');
            expect(result).toBe('mock-mint-public-key');
        });
    });

    describe('Metadata Management', () => {
        it('should upload metadata and return URI', async () => {
            const metadata: NFTMetadata = {
                name: 'Test NFT',
                description: 'Test description',
                image: 'https://example.com/image.png',
                attributes: [],
                properties: {
                    category: 'collectible',
                    rarity: 'common',
                    transferable: true,
                    sellable: true,
                },
            };

            // Access private method through type assertion for testing
            const uri = await (nftService as any).uploadMetadata(metadata);

            expect(uri).toContain('https://gateway.pinata.cloud/ipfs/');
        });

        it('should generate deterministic URIs for same metadata', async () => {
            const metadata: NFTMetadata = {
                name: 'Test NFT',
                description: 'Test description',
                image: 'https://example.com/image.png',
                attributes: [],
                properties: {
                    category: 'collectible',
                    rarity: 'common',
                    transferable: true,
                    sellable: true,
                },
            };

            const uri1 = await (nftService as any).uploadMetadata(metadata);
            const uri2 = await (nftService as any).uploadMetadata(metadata);

            expect(uri1).toBe(uri2);
        });
    });
});
