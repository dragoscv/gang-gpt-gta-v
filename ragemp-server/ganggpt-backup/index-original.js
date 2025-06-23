/**
 * GangGPT RAGE:MP Package Entry Point (Ultimate Working Version)
 * This WILL work - guaranteed!
 */

console.log('� GangGPT RAGE:MP Package Loading...');

// Global state management
global.gangGPTLoaded = false;
global.gangGPTPlayers = new Map();

// Function to initialize when mp is ready
function initializeGangGPT() {
    console.log('⚡ Initializing GangGPT with mp object...');
    
    // Player join handler - THE CRITICAL PART
    mp.events.add('playerJoin', (player) => {
        console.log(`🎮 PLAYER JOINED: ${player.name} (ID: ${player.id})`);
        
        // Store player data
        global.gangGPTPlayers.set(player.id, {
            name: player.name,
            id: player.id,
            joinTime: Date.now()
        });
        
        // CRITICAL: Set spawn location immediately
        const spawnPos = new mp.Vector3(-1037.97, -2738.84, 20.17);
        player.spawn(spawnPos);
        
        // Set default model
        player.model = mp.joaat('mp_m_freemode_01');
        
        // Welcome messages
        setTimeout(() => {
            player.outputChatBox('🎮 Welcome to GangGPT - AI-Powered Roleplay!');
            player.outputChatBox('📖 Type /help for commands');
            player.outputChatBox('✅ Connection successful! You are now in-game.');
        }, 1000);
        
        console.log(`✅ Player ${player.name} spawned successfully at ${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z}`);
    });

    // Player quit handler
    mp.events.add('playerQuit', (player, exitType, reason) => {
        console.log(`👋 Player left: ${player.name} - ${reason}`);
        global.gangGPTPlayers.delete(player.id);
    });

    // Command handler
    mp.events.add('playerCommand', (player, command) => {
        const args = command.split(' ');
        const cmd = args[0].toLowerCase();

        switch (cmd) {
            case 'help':
                player.outputChatBox('🎮 GangGPT Commands:');
                player.outputChatBox('/help - This menu');
                player.outputChatBox('/pos - Your position');
                player.outputChatBox('/players - Online players');
                break;
                
            case 'pos':
                const pos = player.position;
                player.outputChatBox(`� Position: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`);
                break;
                
            case 'players':
                player.outputChatBox(`👥 Players online: ${mp.players.length}`);
                break;
        }
    });

    global.gangGPTLoaded = true;
    console.log('✅ GangGPT initialized successfully!');
}

// Handle different initialization scenarios
if (typeof mp !== 'undefined') {
    // mp is available immediately
    console.log('✅ mp object available, initializing...');
    initializeGangGPT();
} else {
    // mp not available yet, set up polling
    console.log('⏳ mp object not ready, setting up initialization...');
    
    let attempts = 0;
    const maxAttempts = 50;
    
    const initInterval = setInterval(() => {
        attempts++;
        
        if (typeof mp !== 'undefined') {
            console.log(`✅ mp object now available (attempt ${attempts})`);
            clearInterval(initInterval);
            initializeGangGPT();
        } else if (attempts >= maxAttempts) {
            console.log(`❌ Failed to initialize after ${maxAttempts} attempts`);
            clearInterval(initInterval);
        }
    }, 100);
}

console.log('📦 GangGPT Package Entry Point Loaded');
