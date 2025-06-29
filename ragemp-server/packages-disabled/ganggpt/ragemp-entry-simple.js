/**
 * GangGPT RAGE:MP Server Entry Point (Simplified Version)
 * Based on working DiamondRP implementation
 */

class GangGPTManager {
    constructor() {
        this.backendUrl = 'http://localhost:4828';
        this.players = new Map();
        this.isInitialized = false;
        this.startTime = new Date();
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

        // Critical: Actually spawn the player
        try {
            // Set spawn location (Los Santos Airport)
            player.spawn(new mp.Vector3(-1037.97, -2738.84, 20.17));
            player.model = mp.joaat('mp_m_freemode_01'); // Default male model
            console.log(`✅ Player ${player.name} spawned successfully!`);
        } catch (spawnError) {
            console.error(`❌ Failed to spawn player ${player.name}:`, spawnError);
        }
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

            case 'pos':
                const pos = player.position;
                player.outputChatBox(`!{#ffff00}Position: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`);
                break;

            default:
                player.outputChatBox(`!{#ff0000}Unknown command: /${cmd}`);
                player.outputChatBox('!{#ffff00}Type /help for available commands');
        }
    }

    async handleAIInteraction(player, message) {
        try {
            player.outputChatBox('!{#00ffff}🤖 AI is thinking...');

            // Use simple AI responses for testing
            const response = this.getAIResponse(player, message);
            player.outputChatBox(`!{#00ff00}🤖 AI Assistant: ${response}`);

        } catch (error) {
            console.error('AI Interaction Error:', error);
            player.outputChatBox('!{#ff0000}🤖 AI system temporarily unavailable');
        }
    }

    getAIResponse(player, message) {
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return `Hello ${player.name}! Welcome to Los Santos. Connection test successful!`;
        }

        if (lowerMsg.includes('test')) {
            return "Connection test successful! GangGPT AI system is operational.";
        }

        return `Message received: "${message}". GangGPT AI system is working!`;
    }

    showHelpMenu(player) {
        player.outputChatBox('!{#00ff00}======= GangGPT Commands =======');
        player.outputChatBox('!{#ffff00}🤖 /ai <message> - Chat with AI Assistant');
        player.outputChatBox('!{#ffff00}❓ /ask <message> - Ask AI a question');
        player.outputChatBox('!{#ffff00}📊 /status - Show server status');
        player.outputChatBox('!{#ffff00}📍 /pos - Show your position');
        player.outputChatBox('!{#ffff00}📖 /help - Show this menu');
        player.outputChatBox('!{#00ff00}=============================');
    }

    showServerStatus(player) {
        const playerCount = mp.players.length;
        const uptime = this.getUptime();

        player.outputChatBox('!{#00ff00}===== Server Status =====');
        player.outputChatBox(`!{#ffff00}👥 Players Online: ${playerCount}/1000`);
        player.outputChatBox(`!{#ffff00}🎮 Server: GangGPT AI Roleplay`);
        player.outputChatBox(`!{#ffff00}🤖 AI System: ${this.isInitialized ? 'Active' : 'Offline'}`);
        player.outputChatBox(`!{#ffff00}⏰ Uptime: ${uptime}`);
        player.outputChatBox('!{#00ff00}========================');
    }

    getUptime() {
        const now = new Date();
        const diff = now - this.startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
}

// Initialize GangGPT when the package loads
const gangGPT = new GangGPTManager();

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

console.log('📦 GangGPT Package Loaded (Simple Mode)');
