const axios = require('axios');

// GangGPT - AI-Powered RAGE:MP Integration
console.log('\n=== GangGPT Package Loading ===');
console.log('AI-Powered Roleplay Server Initializing...');

const BACKEND_URL = 'http://localhost:4828';
let backendConnected = false;

// Helper function to make API calls to backend
async function callBackendAPI(endpoint, data = {}) {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/game/${endpoint}`, data, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'GangGPT-RAGE-Server'
            },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.log(`[GangGPT] Backend API Error (${endpoint}):`, error.message);
        return null;
    }
}

// Test backend connectivity
async function testBackendConnection() {
    console.log('[GangGPT] Testing backend connection...');
    try {
        const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 3000 });
        if (response.status === 200) {
            console.log('[GangGPT] ✅ Backend connected successfully!');
            console.log('[GangGPT] Backend services:', response.data);
            backendConnected = true;
            return true;
        }
    } catch (error) {
        console.log('[GangGPT] ❌ Backend connection failed:', error.message);
        console.log('[GangGPT] Running in offline mode...');
        backendConnected = false;
        return false;
    }
}

// Wait for mp object and register events
function initializeGangGPT() {
    console.log('[GangGPT] Setting up RAGE:MP integration...');
    
    // Check if mp is available immediately
    if (typeof mp !== 'undefined' && mp && mp.events) {
        console.log('[GangGPT] ✅ mp object found! Registering events...');
        registerEvents();
        return;
    }
    
    // If mp not available, wait for global mp to be defined
    console.log('[GangGPT] mp object not ready, waiting for initialization...');
    
    // Use a more patient approach with longer intervals
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max
    
    const checkMp = () => {
        attempts++;
        
        if (typeof mp !== 'undefined' && mp && mp.events) {
            console.log('[GangGPT] ✅ mp object initialized! Registering events...');
            registerEvents();
        } else if (attempts < maxAttempts) {
            console.log(`[GangGPT] Attempt ${attempts}/${maxAttempts}: mp object not ready, waiting...`);
            setTimeout(checkMp, 100);
        } else {
            console.log('[GangGPT] ❌ mp object never became available. Running in limited mode.');
            console.log('[GangGPT] Backend integration will work, but RAGE:MP events disabled.');
        }
    };
    
    setTimeout(checkMp, 100);
}

// Register RAGE:MP events
function registerEvents() {
    try {
        console.log('[GangGPT] Registering RAGE:MP events...');
        
        // Player join event
        mp.events.add('playerJoin', async (player) => {
            console.log(`[GangGPT] Player joined: ${player.name} (${player.id})`);
            
            // Welcome message
            player.outputChatBox('🤖 Welcome to GangGPT - AI-Powered Roleplay Server!');
            player.outputChatBox('💡 Use /ai [message] to talk with AI or /help for commands');
            
            // Notify backend
            if (backendConnected) {
                await callBackendAPI('player-join', {
                    playerId: player.id,
                    playerName: player.name,
                    ip: player.ip
                });
            }
        });
        
        // Player quit event
        mp.events.add('playerQuit', async (player, exitType, reason) => {
            console.log(`[GangGPT] Player quit: ${player.name} (${exitType})`);
            
            // Notify backend
            if (backendConnected) {
                await callBackendAPI('player-quit', {
                    playerId: player.id,
                    playerName: player.name,
                    exitType,
                    reason
                });
            }
        });
        
        // Chat commands
        mp.events.add('playerChat', async (player, message) => {
            console.log(`[GangGPT] Chat from ${player.name}: ${message}`);
            
            // Handle AI commands
            if (message.startsWith('/ai ') || message.startsWith('/ask ')) {
                const aiMessage = message.substring(4);
                if (aiMessage.trim()) {
                    player.outputChatBox('🤖 AI is thinking...');
                    
                    if (backendConnected) {
                        const response = await callBackendAPI('chat', {
                            playerId: player.id,
                            playerName: player.name,
                            message: aiMessage,
                            type: 'ai_request'
                        });
                        
                        if (response && response.reply) {
                            player.outputChatBox(`🤖 AI: ${response.reply}`);
                        } else {
                            player.outputChatBox('🤖 AI: Sorry, I couldn\'t process that right now.');
                        }
                    } else {
                        player.outputChatBox('🤖 AI: Backend offline - try again later!');
                    }
                } else {
                    player.outputChatBox('💡 Usage: /ai [your message]');
                }
                return; // Don't broadcast AI commands
            }
            
            // Handle help command
            if (message === '/help') {
                player.outputChatBox('🎮 GangGPT Commands:');
                player.outputChatBox('  /ai [message] - Talk to AI assistant');
                player.outputChatBox('  /ask [question] - Ask AI a question');
                player.outputChatBox('  /status - Server status');
                player.outputChatBox('  /help - Show this help');
                return;
            }
            
            // Handle status command
            if (message === '/status') {
                const playerCount = mp.players.length;
                player.outputChatBox(`🎮 GangGPT Status:`);
                player.outputChatBox(`  Players Online: ${playerCount}`);
                player.outputChatBox(`  Backend: ${backendConnected ? '✅ Connected' : '❌ Offline'}`);
                player.outputChatBox(`  AI Services: ${backendConnected ? '🤖 Active' : '💤 Standby'}`);
                return;
            }
            
            // Regular chat - notify backend and broadcast
            if (backendConnected) {
                await callBackendAPI('chat', {
                    playerId: player.id,
                    playerName: player.name,
                    message: message,
                    type: 'chat'
                });
            }
            
            // Broadcast chat message
            mp.players.broadcast(`${player.name}: ${message}`);
        });
        
        console.log('[GangGPT] ✅ All events registered successfully!');
        
        // Send server state to backend
        if (backendConnected) {
            setInterval(async () => {
                await callBackendAPI('state', {
                    players: mp.players.length,
                    timestamp: Date.now()
                });
            }, 30000); // Every 30 seconds
        }
        
    } catch (error) {
        console.log('[GangGPT] ❌ Error registering events:', error.message);
    }
}

// Initialize GangGPT
async function initialize() {
    console.log('[GangGPT] Initializing AI-Powered Roleplay System...');
    
    // Test backend connection first
    await testBackendConnection();// Register for packagesLoaded event if mp is available
if (typeof mp !== 'undefined' && mp && mp.events) {
    console.log('[GangGPT] mp object available, registering for packagesLoaded event...');
    mp.events.add('packagesLoaded', () => {
        console.log('[GangGPT] packagesLoaded event fired!');
        registerEvents();
    });
} else {
    console.log('[GangGPT] mp object not available, using delayed initialization...');
    initializeGangGPT();
}
    
    console.log('[GangGPT] ✅ Initialization complete!');
    console.log('[GangGPT] Server ready for AI-powered roleplay!');
}

// Start initialization
initialize().catch(error => {
    console.log('[GangGPT] ❌ Initialization failed:', error.message);
});

console.log('[GangGPT] Package loaded successfully!');
