// Ultra-minimal RAGE:MP server package to test mp object availability
console.log('🚀 Minimal GangGPT Package Starting...');

// Different approaches to access mp object
if (typeof mp !== 'undefined') {
    console.log('✅ mp object is available immediately');
    initializeServer();
} else if (typeof global !== 'undefined' && global.mp) {
    console.log('✅ mp object found in global scope');
    mp = global.mp;
    initializeServer();
} else {
    console.log('❌ mp object not found, trying setTimeout approach...');
    setTimeout(() => {
        if (typeof mp !== 'undefined') {
            console.log('✅ mp object became available after timeout');
            initializeServer();
        } else {
            console.log('❌ mp object still not available after timeout');
        }
    }, 1000);
}

function initializeServer() {
    console.log('🎯 Initializing minimal server...');
    
    try {
        // Register player connect event
        mp.events.add('playerJoin', (player) => {
            console.log(`[JOIN] Player connected: ${player.name || 'Unknown'} (${player.ip})`);
            
            // Spawn player at default location
            player.spawn(new mp.Vector3(-1035.71, -2731.87, 12.756));
            player.model = mp.joaat('mp_m_freemode_01');
            
            console.log(`[SPAWN] Player spawned successfully: ${player.name}`);
        });

        mp.events.add('playerQuit', (player, exitType, reason) => {
            console.log(`[QUIT] Player disconnected: ${player.name} - ${reason}`);
        });

        console.log('✅ Minimal server initialization complete');
        console.log('🌟 Server is ready for connections!');
        
    } catch (error) {
        console.error('❌ Error during server initialization:', error);
    }
}
