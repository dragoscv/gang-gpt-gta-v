"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Database seeding script for development and testing
 */
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Create admin user
    const adminPasswordHash = await bcryptjs_1.default.hash('admin123!@#', 12);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@ganggpt.dev' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@ganggpt.dev',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log('✅ Admin user created:', adminUser.username);
    // Create test user
    const testPasswordHash = await bcryptjs_1.default.hash('test123!@#', 12);
    const testUser = await prisma.user.upsert({
        where: { email: 'test@ganggpt.dev' },
        update: {},
        create: {
            username: 'testplayer',
            email: 'test@ganggpt.dev',
            passwordHash: testPasswordHash,
            role: 'PLAYER',
            isActive: true,
        },
    });
    console.log('✅ Test user created:', testUser.username);
    // Create user profiles
    await prisma.userProfile.upsert({
        where: { userId: adminUser.id },
        update: {},
        create: {
            userId: adminUser.id,
            money: 50000,
            bank: 100000,
        },
    });
    await prisma.userProfile.upsert({
        where: { userId: testUser.id },
        update: {},
        create: {
            userId: testUser.id,
            money: 5000,
            bank: 0,
        },
    });
    // Create test character for test user
    const testCharacter = await prisma.character.upsert({
        where: { id: 'test-character-1' },
        update: {},
        create: {
            id: 'test-character-1',
            userId: testUser.id,
            name: 'Test Character',
            level: 5,
            experience: 2500,
            money: 7500,
            bank: 2500,
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            health: 100,
            armor: 0,
        },
    });
    console.log('✅ Test character created:', testCharacter.name);
    // Create default factions
    const factions = [
        {
            id: 'los-santos-police',
            name: 'Los Santos Police Department',
            description: 'The law enforcement agency of Los Santos',
            type: 'GOVERNMENT',
            influence: 85,
            color: '#0066cc',
            aiPersonality: JSON.stringify({
                traits: ['lawful', 'protective', 'suspicious'],
                priorities: ['public safety', 'law enforcement', 'order'],
            }),
        },
        {
            id: 'grove-street-families',
            name: 'Grove Street Families',
            description: 'A street gang based in Grove Street',
            type: 'GANG',
            influence: 65,
            color: '#00cc00',
            aiPersonality: JSON.stringify({
                traits: ['territorial', 'loyal', 'aggressive'],
                priorities: ['territory control', 'drug trade', 'family protection'],
            }),
        },
        {
            id: 'diamond-casino',
            name: 'Diamond Casino & Resort',
            description: 'A luxury entertainment complex',
            type: 'BUSINESS',
            influence: 70,
            color: '#ffd700',
            aiPersonality: JSON.stringify({
                traits: ['business-minded', 'profit-focused', 'sophisticated'],
                priorities: ['profit maximization', 'customer satisfaction', 'reputation'],
            }),
        },
    ];
    for (const faction of factions) {
        const createdFaction = await prisma.faction.upsert({
            where: { id: faction.id },
            update: {},
            create: faction,
        });
        console.log('✅ Faction created:', createdFaction.name);
    }
    // Create default territories
    const territories = [
        {
            id: 'downtown-ls',
            name: 'Downtown Los Santos',
            description: 'The bustling heart of the city',
            boundaryData: JSON.stringify({
                type: 'rectangle',
                coordinates: [
                    { x: -800, y: -800 },
                    { x: 800, y: 800 },
                ],
            }),
            centerX: 0,
            centerY: 0,
            size: 1600,
            economicValue: 95,
            strategicValue: 100,
            population: 50000,
            crimeLevel: 0.4,
            lawEnforcement: 0.8,
        },
        {
            id: 'grove-street',
            name: 'Grove Street',
            description: 'A residential area with gang activity',
            boundaryData: JSON.stringify({
                type: 'rectangle',
                coordinates: [
                    { x: 2400, y: -1700 },
                    { x: 2700, y: -1400 },
                ],
            }),
            centerX: 2550,
            centerY: -1550,
            size: 300,
            economicValue: 60,
            strategicValue: 75,
            population: 5000,
            crimeLevel: 0.7,
            lawEnforcement: 0.3,
        },
        {
            id: 'vinewood',
            name: 'Vinewood',
            description: 'The entertainment district',
            boundaryData: JSON.stringify({
                type: 'rectangle',
                coordinates: [
                    { x: 300, y: 1100 },
                    { x: 900, y: 1500 },
                ],
            }),
            centerX: 600,
            centerY: 1300,
            size: 600,
            economicValue: 85,
            strategicValue: 80,
            population: 15000,
            crimeLevel: 0.3,
            lawEnforcement: 0.6,
        },
    ];
    for (const territory of territories) {
        const createdTerritory = await prisma.territory.upsert({
            where: { id: territory.id },
            update: {},
            create: territory,
        });
        console.log('✅ Territory created:', createdTerritory.name);
    }
    // Create faction influence in territories
    const influences = [
        { factionId: 'los-santos-police', territoryId: 'downtown-ls', influenceScore: 0.8 },
        { factionId: 'grove-street-families', territoryId: 'grove-street', influenceScore: 0.9 },
        { factionId: 'diamond-casino', territoryId: 'vinewood', influenceScore: 0.7 },
    ];
    for (const influence of influences) {
        await prisma.factionInfluenceMatrix.upsert({
            where: {
                factionId_territoryId: {
                    factionId: influence.factionId,
                    territoryId: influence.territoryId,
                },
            },
            update: {},
            create: {
                factionId: influence.factionId,
                territoryId: influence.territoryId,
                influenceScore: influence.influenceScore,
                militaryPresence: influence.influenceScore * 0.8,
                economicControl: influence.influenceScore * 0.6,
                popularSupport: influence.influenceScore * 0.7,
            },
        });
    }
    console.log('✅ Faction influences created');
    // Create sample NPCs
    const npcs = [
        {
            id: 'officer-martinez',
            name: 'Officer Martinez',
            type: 'LAW_ENFORCEMENT',
            personality: JSON.stringify({
                traits: ['professional', 'observant', 'helpful'],
                mood: 'neutral',
                aggression: 0.2,
                intelligence: 0.8,
                sociability: 0.6,
            }),
            positionX: 425.0,
            positionY: -979.0,
            positionZ: 30.0,
            factionId: 'los-santos-police',
            aggression: 0.2,
            intelligence: 0.8,
            loyalty: 0.9,
            sociability: 0.6,
        },
        {
            id: 'grove-member-carl',
            name: 'Carl Johnson',
            type: 'GANG_MEMBER',
            personality: JSON.stringify({
                traits: ['loyal', 'street-smart', 'protective'],
                mood: 'cautious',
                aggression: 0.6,
                intelligence: 0.7,
                sociability: 0.8,
            }),
            positionX: 2495.0,
            positionY: -1688.0,
            positionZ: 13.0,
            factionId: 'grove-street-families',
            aggression: 0.6,
            intelligence: 0.7,
            loyalty: 0.95,
            sociability: 0.8,
        },
    ];
    for (const npc of npcs) {
        const createdNpc = await prisma.nPC.upsert({
            where: { id: npc.id },
            update: {},
            create: npc,
        });
        console.log('✅ NPC created:', createdNpc.name);
    }
    // Create sample economic events
    const economicEvents = [
        {
            eventType: 'MARKET_CRASH',
            impactType: 'NEGATIVE',
            severity: 0.3,
            description: 'Minor market downturn affecting luxury goods',
            duration: 3600, // 1 hour
            expiresAt: new Date(Date.now() + 3600 * 1000),
        },
        {
            eventType: 'POLICE_OPERATION',
            impactType: 'MIXED',
            severity: 0.5,
            description: 'Increased police presence in downtown area',
            duration: 7200, // 2 hours
            expiresAt: new Date(Date.now() + 7200 * 1000),
        },
    ];
    for (const event of economicEvents) {
        await prisma.economicEvent.create({
            data: event,
        });
    }
    console.log('✅ Economic events created');
    console.log('🎉 Database seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map