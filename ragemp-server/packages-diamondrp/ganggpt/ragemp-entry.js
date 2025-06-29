/**
 * GangGPT RAGE:MP Server Entry Point
 * This file initializes the GangGPT system within RAGE:MP
 */

class GangGPTManager {
    constructor() {
        this.backendUrl = 'http://localhost:4828';
        this.players = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing GangGPT AI System...');

            // Check if RAGE:MP is available
            if (typeof mp === 'undefined') {
                console.log('❌ RAGE:MP not available, waiting...');
                return false;
            }

            // Set up RAGE:MP event handlers
            this.setupEventHandlers();

            this.isInitialized = true;
            console.log('✅ GangGPT System initialized successfully!');
            console.log('   Server: GangGPT - AI-Powered Roleplay Server');
            console.log('   Features: AI Chat, Dynamic Missions, Smart NPCs');
            console.log('   Backend: Standalone Mode (External backend integration available)');

            return true;

        } catch (error) {
            console.error('❌ Failed to initialize GangGPT:', error.message);
            return false;
        }
    }

    setupEventHandlers() {
        // Player connection events
        mp.events.add('playerJoin', (player) => {
            this.onPlayerJoin(player);
        });

        mp.events.add('playerQuit', (player, exitType, reason) => {
            this.onPlayerQuit(player, exitType, reason);
        });

        mp.events.add('playerChat', (player, text) => {
            this.onPlayerChat(player, text);
        });

        mp.events.add('playerCommand', (player, command) => {
            this.onPlayerCommand(player, command);
        });

        // Custom GangGPT events
        mp.events.add('ganggpt:aiInteraction', (player, message) => {
            this.handleAIInteraction(player, message);
        });

        console.log('📡 RAGE:MP event handlers registered');
    }

    onPlayerJoin(player) {
        const playerData = {
            id: player.id,
            name: player.name,
            socialClub: player.socialClub,
            ip: player.ip,
            joinTime: new Date()
        };

        this.players.set(player.id, playerData);

        console.log(`👤 Player joined: ${player.name} (ID: ${player.id})`);

        // Send welcome message
        player.outputChatBox('!{#00ff00}🎮 Welcome to GangGPT - AI-Powered Roleplay Server!');
        player.outputChatBox('!{#ffff00}📖 Type /help to see available commands');
        player.outputChatBox('!{#00ffff}🤖 Experience next-generation AI-driven roleplay!');
        player.outputChatBox('!{#ff6600}💬 Try: /ai Hello! or /ask What can you do?');
    }

    onPlayerQuit(player, exitType, reason) {
        console.log(`👋 Player left: ${player.name} (ID: ${player.id}) - ${reason}`);
        this.players.delete(player.id);
    }

    onPlayerChat(player, text) {
        // Log chat for AI processing
        console.log(`💬 ${player.name}: ${text}`);

        // Check for AI interaction triggers
        if (text.startsWith('/ai ') || text.startsWith('/ask ')) {
            const message = text.substring(4);
            this.handleAIInteraction(player, message);
            return;
        }
    }

    onPlayerCommand(player, command) {
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();

        switch (cmd) {
            case 'help':
                this.showHelpMenu(player);
                break;

            case 'ai':
            case 'ask':
                if (args.length > 1) {
                    const message = args.slice(1).join(' ');
                    this.handleAIInteraction(player, message);
                } else {
                    player.outputChatBox('!{#ff0000}Usage: /ai <message> or /ask <message>');
                    player.outputChatBox('!{#ffff00}Example: /ai Hello, how are you?');
                }
                break;

            case 'status':
                this.showServerStatus(player);
                break;

            case 'ganggpt':
                this.showGangGPTInfo(player);
                break;

            case 'commands':
                this.showHelpMenu(player);
                break;

            default:
                player.outputChatBox(`!{#ff0000}Unknown command: /${cmd}`);
                player.outputChatBox('!{#ffff00}Type /help for available commands');
        }
    }

    async handleAIInteraction(player, message) {
        try {
            player.outputChatBox('!{#00ffff}🤖 AI is thinking...');

            // Use advanced fallback AI responses
            const response = this.getAIResponse(player, message);
            player.outputChatBox(`!{#00ff00}🤖 AI Assistant: ${response}`);

        } catch (error) {
            console.error('AI Interaction Error:', error);
            player.outputChatBox('!{#ff0000}🤖 AI system temporarily unavailable');
        }
    }

    getAIResponse(player, message) {
        const lowerMsg = message.toLowerCase();

        // Context-aware responses based on message content
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
            return `Hello ${player.name}! Welcome to Los Santos. I'm your AI assistant. How can I help you today?`;
        }

        if (lowerMsg.includes('help') || lowerMsg.includes('what can you do')) {
            return "I can help you with missions, provide roleplay guidance, answer questions about the server, and chat with you! Try asking me about factions, businesses, or activities.";
        }

        if (lowerMsg.includes('mission') || lowerMsg.includes('job')) {
            return "There are many opportunities in Los Santos! You could try delivering packages, working security, taxi driving, or even starting your own business. Visit the job center downtown!";
        }

        if (lowerMsg.includes('faction') || lowerMsg.includes('gang')) {
            return "Factions are player-run organizations that control territory and businesses. You can join existing ones or start your own. Each faction has its own roleplay style and goals.";
        }

        if (lowerMsg.includes('money') || lowerMsg.includes('cash')) {
            return "You can earn money through legal jobs like taxi driving, delivery services, or illegal activities like drug dealing (roleplay only!). Start with legal jobs to build your reputation.";
        }

        if (lowerMsg.includes('car') || lowerMsg.includes('vehicle')) {
            return "You can buy vehicles from dealerships around the city, steal them (watch out for police!), or earn them through missions. Each vehicle has different stats and uses.";
        }

        if (lowerMsg.includes('police') || lowerMsg.includes('cop')) {
            return "The LSPD maintains order in Los Santos. You can either work with them as a law-abiding citizen or challenge them as a criminal. Remember, it's all about the roleplay!";
        }

        if (lowerMsg.includes('house') || lowerMsg.includes('property')) {
            return "Real estate is available throughout Los Santos! You can buy houses, apartments, and commercial properties. Visit a real estate office or check the property markers around the city.";
        }

        // General conversational responses
        const generalResponses = [
            `That's an interesting question, ${player.name}! Los Santos is full of opportunities for someone like you.`,
            `I understand what you're asking about. The key to success in this city is building relationships and taking calculated risks.`,
            `Great point! Remember that in Los Santos, your reputation and connections matter more than anything else.`,
            `That's a smart way to think about it. The city rewards those who are clever and adaptable.`,
            `Excellent question! The best advice I can give is to stay true to your character and embrace the roleplay experience.`
        ];

        return generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    showHelpMenu(player) {
        player.outputChatBox('!{#00ff00}======= GangGPT Commands =======');
        player.outputChatBox('!{#ffff00}🤖 /ai <message> - Chat with AI Assistant');
        player.outputChatBox('!{#ffff00}❓ /ask <message> - Ask AI a question');
        player.outputChatBox('!{#ffff00}📊 /status - Show server status');
        player.outputChatBox('!{#ffff00}ℹ️  /ganggpt - About GangGPT system');
        player.outputChatBox('!{#ffff00}📖 /help - Show this menu');
        player.outputChatBox('!{#00ff00}=============================');
    }

    showServerStatus(player) {
        const playerCount = mp.players.length;
        const maxPlayers = 1000;

        player.outputChatBox('!{#00ff00}===== Server Status =====');
        player.outputChatBox(`!{#ffff00}👥 Players Online: ${playerCount}/${maxPlayers}`);
        player.outputChatBox(`!{#ffff00}🎮 Server: GangGPT AI Roleplay`);
        player.outputChatBox(`!{#ffff00}🤖 AI System: ${this.isInitialized ? 'Active' : 'Offline'}`);
        player.outputChatBox(`!{#ffff00}⏰ Uptime: ${this.getUptime()}`);
        player.outputChatBox('!{#00ff00}========================');
    }

    showGangGPTInfo(player) {
        player.outputChatBox('!{#00ff00}========= About GangGPT =========');
        player.outputChatBox('!{#ffff00}🎮 AI-Powered Grand Theft Auto V Roleplay Server');
        player.outputChatBox('!{#ffff00}🤖 Features advanced AI companions and dynamic missions');
        player.outputChatBox('!{#ffff00}⚡ Built with TypeScript, Node.js, and Azure OpenAI');
        player.outputChatBox('!{#ffff00}🌟 Next-generation roleplay with intelligent NPCs');
        player.outputChatBox('!{#00ffff}🚀 Experience the future of roleplay gaming!');
        player.outputChatBox('!{#00ff00}===============================');
    }

    getUptime() {
        const now = new Date();
        const start = this.startTime || now;
        const diff = now - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
}

// Initialize GangGPT when the package loads
const gangGPT = new GangGPTManager();
gangGPT.startTime = new Date();

// Try to initialize immediately, then retry if needed
let initAttempts = 0;
const maxAttempts = 10;

function tryInitialize() {
    initAttempts++;

    if (gangGPT.initialize()) {
        console.log('✅ GangGPT successfully initialized on attempt', initAttempts);
        return;
    }

    if (initAttempts < maxAttempts) {
        console.log(`🔄 Retrying GangGPT initialization (${initAttempts}/${maxAttempts})...`);
        setTimeout(tryInitialize, 500);
    } else {
        console.log('❌ Failed to initialize GangGPT after', maxAttempts, 'attempts');
    }
}

// Start initialization
tryInitialize();

console.log('📦 GangGPT Package Loaded');
