import { EventEmitter } from 'events';
import { z } from 'zod';
import {
    MarketplaceListing,
    NFTMetadata,
    BlockchainTransaction,
    BlockchainConfig,
    MarketplaceError
} from './types';

/**
 * NFT Marketplace Service for GangGPT
 * Handles buying, selling, and trading of in-game NFTs
 */
export class MarketplaceService extends EventEmitter {
    private config: BlockchainConfig;
    private listings: Map<string, MarketplaceListing> = new Map();
    private offers: Map<string, MarketplaceOffer[]> = new Map(); // tokenId -> offers
    private auctions: Map<string, Auction> = new Map();
    private trades: Map<string, Trade> = new Map();

    constructor(config: BlockchainConfig) {
        super();
        this.config = config;
        this.initializeMarketplace();
    }

    /**
     * Initialize marketplace with default settings
     */
    private async initializeMarketplace(): Promise<void> {
        this.marketplaceConfig = {
            tradingFee: 0.025, // 2.5%
            royaltyFee: 0.05, // 5%
            minListingDuration: 24 * 60 * 60, // 24 hours
            maxListingDuration: 30 * 24 * 60 * 60, // 30 days
            minAuctionDuration: 60 * 60, // 1 hour
            maxAuctionDuration: 7 * 24 * 60 * 60, // 7 days
            escrowDelay: 60 * 60, // 1 hour
        };
    }

    /**
     * List an NFT for sale
     */
    async listNFT(
        seller: string,
        tokenId: string,
        contractAddress: string,
        price: string,
        currency: 'ETH' | 'SOL' | 'MATIC' | 'GANG',
        duration?: number
    ): Promise<string> {
        try {
            // Verify ownership
            const isOwner = await this.verifyOwnership(seller, tokenId, contractAddress);
            if (!isOwner) {
                throw new MarketplaceError('Not the owner of this NFT', tokenId);
            }

            // Check if already listed
            const existingListing = Array.from(this.listings.values()).find(
                l => l.tokenId === tokenId && l.contractAddress === contractAddress && l.status === 'active'
            );
            if (existingListing) {
                throw new MarketplaceError('NFT is already listed for sale', tokenId);
            }

            const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            const expiresAt = new Date(now.getTime() + (duration || this.marketplaceConfig.minListingDuration) * 1000);

            // Get NFT metadata
            const metadata = await this.getNFTMetadata(tokenId, contractAddress);
            if (!metadata) {
                throw new MarketplaceError('Could not fetch NFT metadata', tokenId);
            }

            const listing: MarketplaceListing = {
                id: listingId,
                tokenId,
                contractAddress,
                seller,
                price,
                currency,
                status: 'active',
                listedAt: now,
                expiresAt,
                metadata,
            };

            this.listings.set(listingId, listing);

            // Create transaction record
            const transaction: BlockchainTransaction = {
                id: `list_${listingId}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'transfer',
                from: seller,
                to: this.config.contractAddresses.marketplace,
                tokenId,
                gasUsed: '0.001',
                gasPrice: '0.000005',
                status: 'confirmed',
                timestamp: now,
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    action: 'list',
                    listingId,
                    price,
                    currency,
                },
            };

            // Schedule automatic delisting
            setTimeout(() => {
                this.delistExpiredNFT(listingId);
            }, (duration || this.marketplaceConfig.minListingDuration) * 1000);

            this.emit('nftListed', { listing, transaction });

            return listingId;
        } catch (error) {
            throw new MarketplaceError(
                `Failed to list NFT: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tokenId,
                'list'
            );
        }
    }

    /**
     * Buy an NFT
     */
    async buyNFT(buyer: string, listingId: string): Promise<string> {
        try {
            const listing = this.listings.get(listingId);
            if (!listing) {
                throw new MarketplaceError('Listing not found', undefined, 'buy');
            }

            if (listing.status !== 'active') {
                throw new MarketplaceError('Listing is not active', listing.tokenId, 'buy');
            }

            if (listing.expiresAt && new Date() > listing.expiresAt) {
                throw new MarketplaceError('Listing has expired', listing.tokenId, 'buy');
            }

            if (listing.seller === buyer) {
                throw new MarketplaceError('Cannot buy your own NFT', listing.tokenId, 'buy');
            }

            // Check buyer's balance
            const hasBalance = await this.checkBalance(buyer, listing.price, listing.currency);
            if (!hasBalance) {
                throw new MarketplaceError('Insufficient balance', listing.tokenId, 'buy');
            }

            // Calculate fees
            const fees = this.calculateFees(listing.price);

            // Create sale transaction
            const saleId = `sale_${Date.now()}_${buyer}`;
            const transaction: BlockchainTransaction = {
                id: saleId,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'sale',
                from: listing.seller,
                to: buyer,
                tokenId: listing.tokenId,
                amount: listing.price,
                gasUsed: '0.002',
                gasPrice: '0.000005',
                status: 'confirmed',
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    listingId,
                    salePrice: listing.price,
                    currency: listing.currency,
                    tradingFee: fees.tradingFee,
                    royaltyFee: fees.royaltyFee,
                },
            };

            // Update listing status
            listing.status = 'sold';

            // Process payment distribution
            await this.processPayment({
                buyer,
                seller: listing.seller,
                amount: listing.price,
                currency: listing.currency,
                fees,
                tokenId: listing.tokenId,
            });

            // Transfer NFT ownership
            await this.transferNFTOwnership(listing.tokenId, listing.contractAddress, listing.seller, buyer);

            this.emit('nftSold', { listing, buyer, salePrice: listing.price, transaction });

            return saleId;
        } catch (error) {
            throw new MarketplaceError(
                `Failed to buy NFT: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                'buy'
            );
        }
    }

    /**
     * Cancel an NFT listing
     */
    async cancelListing(seller: string, listingId: string): Promise<string> {
        try {
            const listing = this.listings.get(listingId);
            if (!listing) {
                throw new MarketplaceError('Listing not found', undefined, 'cancel');
            }

            if (listing.seller !== seller) {
                throw new MarketplaceError('Only the seller can cancel the listing', listing.tokenId, 'cancel');
            }

            if (listing.status !== 'active') {
                throw new MarketplaceError('Listing is not active', listing.tokenId, 'cancel');
            }

            // Update listing status
            listing.status = 'cancelled';

            const transaction: BlockchainTransaction = {
                id: `cancel_${listingId}`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'transfer',
                from: this.config.contractAddresses.marketplace,
                to: seller,
                tokenId: listing.tokenId,
                gasUsed: '0.0005',
                gasPrice: '0.000005',
                status: 'confirmed',
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    action: 'cancel',
                    listingId,
                },
            };

            this.emit('listingCancelled', { listing, transaction });

            return transaction.id;
        } catch (error) {
            throw new MarketplaceError(
                `Failed to cancel listing: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                'cancel'
            );
        }
    }

    /**
     * Make an offer on an NFT
     */
    async makeOffer(
        offerer: string,
        tokenId: string,
        contractAddress: string,
        offerPrice: string,
        currency: 'ETH' | 'SOL' | 'MATIC' | 'GANG',
        expirationHours: number = 24
    ): Promise<string> {
        try {
            const offerId = `offer_${Date.now()}_${offerer}`;
            const now = new Date();
            const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

            // Check offerer's balance
            const hasBalance = await this.checkBalance(offerer, offerPrice, currency);
            if (!hasBalance) {
                throw new MarketplaceError('Insufficient balance for offer', tokenId, 'offer');
            }

            const offer: MarketplaceOffer = {
                id: offerId,
                tokenId,
                contractAddress,
                offerer,
                offerPrice,
                currency,
                status: 'active',
                createdAt: now,
                expiresAt,
            };

            // Store offer
            const tokenOffers = this.offers.get(tokenId) || [];
            tokenOffers.push(offer);
            this.offers.set(tokenId, tokenOffers);

            // Schedule automatic expiration
            setTimeout(() => {
                this.expireOffer(offerId);
            }, expirationHours * 60 * 60 * 1000);

            this.emit('offerMade', { offer });

            return offerId;
        } catch (error) {
            throw new MarketplaceError(
                `Failed to make offer: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tokenId,
                'offer'
            );
        }
    }

    /**
     * Accept an offer
     */
    async acceptOffer(owner: string, offerId: string): Promise<string> {
        try {
            let offer: MarketplaceOffer | undefined;
            let tokenOffers: MarketplaceOffer[] = [];

            // Find the offer
            for (const [tokenId, offers] of this.offers) {
                const foundOffer = offers.find(o => o.id === offerId);
                if (foundOffer) {
                    offer = foundOffer;
                    tokenOffers = offers;
                    break;
                }
            }

            if (!offer) {
                throw new MarketplaceError('Offer not found', undefined, 'accept_offer');
            }

            if (offer.status !== 'active') {
                throw new MarketplaceError('Offer is not active', offer.tokenId, 'accept_offer');
            }

            if (new Date() > offer.expiresAt) {
                throw new MarketplaceError('Offer has expired', offer.tokenId, 'accept_offer');
            }

            // Verify ownership
            const isOwner = await this.verifyOwnership(owner, offer.tokenId, offer.contractAddress);
            if (!isOwner) {
                throw new MarketplaceError('Not the owner of this NFT', offer.tokenId, 'accept_offer');
            }

            // Calculate fees
            const fees = this.calculateFees(offer.offerPrice);

            // Create sale transaction
            const saleId = `offer_sale_${Date.now()}_${owner}`;
            const transaction: BlockchainTransaction = {
                id: saleId,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                blockchain: 'solana',
                type: 'sale',
                from: owner,
                to: offer.offerer,
                tokenId: offer.tokenId,
                amount: offer.offerPrice,
                gasUsed: '0.002',
                gasPrice: '0.000005',
                status: 'confirmed',
                timestamp: new Date(),
                blockNumber: Math.floor(Math.random() * 1000000),
                metadata: {
                    offerId,
                    salePrice: offer.offerPrice,
                    currency: offer.currency,
                    tradingFee: fees.tradingFee,
                    royaltyFee: fees.royaltyFee,
                },
            };

            // Update offer status
            offer.status = 'accepted';

            // Cancel any active listing for this NFT
            for (const listing of this.listings.values()) {
                if (listing.tokenId === offer.tokenId && listing.status === 'active') {
                    listing.status = 'cancelled';
                }
            }

            // Process payment
            await this.processPayment({
                buyer: offer.offerer,
                seller: owner,
                amount: offer.offerPrice,
                currency: offer.currency,
                fees,
                tokenId: offer.tokenId,
            });

            // Transfer NFT ownership
            await this.transferNFTOwnership(offer.tokenId, offer.contractAddress, owner, offer.offerer);

            this.emit('offerAccepted', { offer, seller: owner, transaction });

            return saleId;
        } catch (error) {
            throw new MarketplaceError(
                `Failed to accept offer: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                'accept_offer'
            );
        }
    }

    /**
     * Create an auction for an NFT
     */
    async createAuction(
        seller: string,
        tokenId: string,
        contractAddress: string,
        startingPrice: string,
        reservePrice: string,
        currency: 'ETH' | 'SOL' | 'MATIC' | 'GANG',
        durationHours: number
    ): Promise<string> {
        try {
            // Verify ownership
            const isOwner = await this.verifyOwnership(seller, tokenId, contractAddress);
            if (!isOwner) {
                throw new MarketplaceError('Not the owner of this NFT', tokenId, 'auction');
            }

            const auctionId = `auction_${Date.now()}_${seller}`;
            const now = new Date();
            const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

            // Get NFT metadata
            const metadata = await this.getNFTMetadata(tokenId, contractAddress);
            if (!metadata) {
                throw new MarketplaceError('Could not fetch NFT metadata', tokenId, 'auction');
            }

            const auction: Auction = {
                id: auctionId,
                tokenId,
                contractAddress,
                seller,
                startingPrice,
                reservePrice,
                currentBid: '0',
                highestBidder: '',
                currency,
                status: 'active',
                startedAt: now,
                endsAt,
                metadata,
                bidHistory: [],
            };

            this.auctions.set(auctionId, auction);

            // Schedule automatic auction end
            setTimeout(() => {
                this.finalizeAuction(auctionId);
            }, durationHours * 60 * 60 * 1000);

            this.emit('auctionCreated', { auction });

            return auctionId;
        } catch (error) {
            throw new MarketplaceError(
                `Failed to create auction: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tokenId,
                'auction'
            );
        }
    }

    /**
     * Place a bid on an auction
     */
    async placeBid(bidder: string, auctionId: string, bidAmount: string): Promise<string> {
        try {
            const auction = this.auctions.get(auctionId);
            if (!auction) {
                throw new MarketplaceError('Auction not found', undefined, 'bid');
            }

            if (auction.status !== 'active') {
                throw new MarketplaceError('Auction is not active', auction.tokenId, 'bid');
            }

            if (new Date() > auction.endsAt) {
                throw new MarketplaceError('Auction has ended', auction.tokenId, 'bid');
            }

            if (auction.seller === bidder) {
                throw new MarketplaceError('Cannot bid on your own auction', auction.tokenId, 'bid');
            }

            // Check bid amount
            const minBid = Math.max(
                parseFloat(auction.currentBid) * 1.05, // 5% increment
                parseFloat(auction.startingPrice)
            );

            if (parseFloat(bidAmount) < minBid) {
                throw new MarketplaceError(
                    `Bid must be at least ${minBid} ${auction.currency}`,
                    auction.tokenId,
                    'bid'
                );
            }

            // Check bidder's balance
            const hasBalance = await this.checkBalance(bidder, bidAmount, auction.currency);
            if (!hasBalance) {
                throw new MarketplaceError('Insufficient balance for bid', auction.tokenId, 'bid');
            }

            const bidId = `bid_${Date.now()}_${bidder}`;
            const bid: AuctionBid = {
                id: bidId,
                auctionId,
                bidder,
                amount: bidAmount,
                timestamp: new Date(),
                txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            };

            // Update auction
            auction.currentBid = bidAmount;
            auction.highestBidder = bidder;
            auction.bidHistory.push(bid);

            // Extend auction if bid is placed in last 10 minutes
            const timeLeft = auction.endsAt.getTime() - Date.now();
            if (timeLeft < 10 * 60 * 1000) { // 10 minutes
                auction.endsAt = new Date(auction.endsAt.getTime() + 10 * 60 * 1000);
            }

            this.emit('bidPlaced', { auction, bid });

            return bidId;
        } catch (error) {
            throw new MarketplaceError(
                `Failed to place bid: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                'bid'
            );
        }
    }

    /**
     * Get marketplace listings with filters
     */
    getListings(filters?: {
        category?: string;
        rarity?: string;
        priceMin?: string;
        priceMax?: string;
        currency?: string;
        status?: 'active' | 'sold' | 'cancelled' | 'expired';
    }): MarketplaceListing[] {
        let listings = Array.from(this.listings.values());

        if (filters) {
            if (filters.category) {
                listings = listings.filter(l => l.metadata.properties.category === filters.category);
            }
            if (filters.rarity) {
                listings = listings.filter(l => l.metadata.properties.rarity === filters.rarity);
            }
            if (filters.priceMin) {
                listings = listings.filter(l => parseFloat(l.price) >= parseFloat(filters.priceMin!));
            }
            if (filters.priceMax) {
                listings = listings.filter(l => parseFloat(l.price) <= parseFloat(filters.priceMax!));
            }
            if (filters.currency) {
                listings = listings.filter(l => l.currency === filters.currency);
            }
            if (filters.status) {
                listings = listings.filter(l => l.status === filters.status);
            }
        }

        return listings.sort((a, b) => b.listedAt.getTime() - a.listedAt.getTime());
    }

    /**
     * Get marketplace statistics
     */
    async getMarketplaceStats(): Promise<MarketplaceStats> {
        const listings = Array.from(this.listings.values());
        const auctions = Array.from(this.auctions.values());

        const soldListings = listings.filter(l => l.status === 'sold');
        const totalVolume = soldListings.reduce((sum, l) => sum + parseFloat(l.price), 0);
        const averagePrice = soldListings.length > 0 ? totalVolume / soldListings.length : 0;

        return {
            totalListings: listings.length,
            activeListings: listings.filter(l => l.status === 'active').length,
            totalSales: soldListings.length,
            totalVolume: totalVolume.toString(),
            averagePrice: averagePrice.toString(),
            activeAuctions: auctions.filter(a => a.status === 'active').length,
            uniqueSellers: new Set(listings.map(l => l.seller)).size,
            uniqueBuyers: new Set(soldListings.map(l => l.seller)).size, // This would be buyers in real implementation
        };
    }

    // Private helper methods
    private async verifyOwnership(owner: string, tokenId: string, contractAddress: string): Promise<boolean> {
        // Mock implementation - would verify on blockchain
        return true;
    }

    private async getNFTMetadata(tokenId: string, contractAddress: string): Promise<NFTMetadata | null> {
        // Mock implementation - would fetch from blockchain
        return {
            name: `Mock NFT ${tokenId}`,
            description: 'Mock NFT for testing',
            image: 'https://example.com/image.png',
            attributes: [],
            properties: {
                category: 'collectible',
                rarity: 'common',
                transferable: true,
                sellable: true,
            },
        };
    }

    private async checkBalance(address: string, amount: string, currency: string): Promise<boolean> {
        // Mock implementation - would check actual balance
        return true;
    }

    private calculateFees(price: string): MarketplaceFees {
        const priceNum = parseFloat(price);
        return {
            tradingFee: (priceNum * this.marketplaceConfig.tradingFee).toString(),
            royaltyFee: (priceNum * this.marketplaceConfig.royaltyFee).toString(),
        };
    }

    private async processPayment(payment: PaymentInfo): Promise<void> {
        // Mock implementation - would process actual payment
        console.log('Processing payment:', payment);
    }

    private async transferNFTOwnership(
        tokenId: string,
        contractAddress: string,
        from: string,
        to: string
    ): Promise<void> {
        // Mock implementation - would transfer on blockchain
        console.log(`Transferring NFT ${tokenId} from ${from} to ${to}`);
    }

    private async delistExpiredNFT(listingId: string): Promise<void> {
        const listing = this.listings.get(listingId);
        if (listing && listing.status === 'active') {
            listing.status = 'expired';
            this.emit('listingExpired', { listing });
        }
    }

    private async expireOffer(offerId: string): Promise<void> {
        for (const offers of this.offers.values()) {
            const offer = offers.find(o => o.id === offerId);
            if (offer && offer.status === 'active') {
                offer.status = 'expired';
                this.emit('offerExpired', { offer });
                break;
            }
        }
    }

    private async finalizeAuction(auctionId: string): Promise<void> {
        const auction = this.auctions.get(auctionId);
        if (!auction || auction.status !== 'active') return;

        if (parseFloat(auction.currentBid) >= parseFloat(auction.reservePrice)) {
            auction.status = 'successful';

            // Process sale to highest bidder
            if (auction.highestBidder) {
                const fees = this.calculateFees(auction.currentBid);

                await this.processPayment({
                    buyer: auction.highestBidder,
                    seller: auction.seller,
                    amount: auction.currentBid,
                    currency: auction.currency,
                    fees,
                    tokenId: auction.tokenId,
                });

                await this.transferNFTOwnership(
                    auction.tokenId,
                    auction.contractAddress,
                    auction.seller,
                    auction.highestBidder
                );
            }

            this.emit('auctionSuccessful', { auction });
        } else {
            auction.status = 'failed';
            this.emit('auctionFailed', { auction, reason: 'Reserve price not met' });
        }
    }

    private marketplaceConfig: MarketplaceConfig = {
        tradingFee: 0.025,
        royaltyFee: 0.05,
        minListingDuration: 24 * 60 * 60,
        maxListingDuration: 30 * 24 * 60 * 60,
        minAuctionDuration: 60 * 60,
        maxAuctionDuration: 7 * 24 * 60 * 60,
        escrowDelay: 60 * 60,
    };
}

// Additional interfaces for marketplace
interface MarketplaceOffer {
    id: string;
    tokenId: string;
    contractAddress: string;
    offerer: string;
    offerPrice: string;
    currency: 'ETH' | 'SOL' | 'MATIC' | 'GANG';
    status: 'active' | 'accepted' | 'rejected' | 'expired';
    createdAt: Date;
    expiresAt: Date;
}

interface Auction {
    id: string;
    tokenId: string;
    contractAddress: string;
    seller: string;
    startingPrice: string;
    reservePrice: string;
    currentBid: string;
    highestBidder: string;
    currency: 'ETH' | 'SOL' | 'MATIC' | 'GANG';
    status: 'active' | 'successful' | 'failed' | 'cancelled';
    startedAt: Date;
    endsAt: Date;
    metadata: NFTMetadata;
    bidHistory: AuctionBid[];
}

interface AuctionBid {
    id: string;
    auctionId: string;
    bidder: string;
    amount: string;
    timestamp: Date;
    txHash: string;
}

interface Trade {
    id: string;
    initiator: string;
    responder: string;
    initiatorItems: TradeItem[];
    responderItems: TradeItem[];
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
    createdAt: Date;
    expiresAt: Date;
}

interface TradeItem {
    type: 'nft' | 'token';
    tokenId?: string;
    contractAddress?: string;
    amount?: string;
    currency?: string;
}

interface MarketplaceFees {
    tradingFee: string;
    royaltyFee: string;
}

interface PaymentInfo {
    buyer: string;
    seller: string;
    amount: string;
    currency: string;
    fees: MarketplaceFees;
    tokenId: string;
}

interface MarketplaceConfig {
    tradingFee: number;
    royaltyFee: number;
    minListingDuration: number;
    maxListingDuration: number;
    minAuctionDuration: number;
    maxAuctionDuration: number;
    escrowDelay: number;
}

interface MarketplaceStats {
    totalListings: number;
    activeListings: number;
    totalSales: number;
    totalVolume: string;
    averagePrice: string;
    activeAuctions: number;
    uniqueSellers: number;
    uniqueBuyers: number;
}
