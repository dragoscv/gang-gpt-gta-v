// Main blockchain package exports
export * from './types';
export * from './nft';
export * from './economy';
export * from './governance';
export * from './marketplace';

// Blockchain utilities (explicit exports to avoid conflicts)
export {
    validateAddress,
    formatTokenAmount,
    parseTokenAmount,
    generateTransactionId,
    generateMockTxHash,
    calculateNetworkFees,
    checkTransactionStatus,
    estimateGas,
    getCurrentGasPrice,
    convertTokenStandard,
    validateNFTMetadata,
    generateIPFSUri,
    ipfsToHttp,
    calculateTradingFees,
    calculateRarityScore,
    batchProcess,
    retryWithBackoff,
    BlockchainEventMonitor
} from './utils';

// Innovation & Future-Proofing exports (specific exports to avoid conflicts)
export {
    VREnvironment,
    ARObject,
    VRInteraction,
    AIModality,
    MultiModalRequest,
    MultiModalResponse,
    VoiceProfile,
    SpeechSynthesisRequest,
    EdgeNode,
    EdgeDeployment,
    Platform,
    CrossPlatformConfig,
    InnovationMetric,
    Experiment,
    VRError,
    AIError,
    EdgeError,
    IVRService,
    IAIService,
    IEdgeService,
    ICrossPlatformService
} from './innovation-types';

export * from './vr-ar';
export * from './advanced-ai';
export * from './edge-computing';
export * from './cross-platform';

// Main service exports
export { NFTService } from './nft';
export { EconomyService } from './economy';
export { GovernanceService } from './governance';
export { MarketplaceService } from './marketplace';

// Innovation service exports
export { VRARService } from './vr-ar';
export { AdvancedAIService } from './advanced-ai';
export { EdgeComputingService } from './edge-computing';
export { CrossPlatformService } from './cross-platform';
