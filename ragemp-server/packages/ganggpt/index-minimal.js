/**
 * Ultra-minimal GangGPT package to test server initialization
 */

console.log('📦 Minimal GangGPT Package Loading...');

// Simple event handler that doesn't depend on MP object timing
const initializeWhenReady = () => {
    if (typeof mp !== 'undefined') {
        console.log('✅ MP object available - GangGPT initialized!');
        
        // Basic player join handler
        mp.events.add('playerJoin', (player) => {
            console.log(`✅ Player joined: ${player.name}`);
            player.outputChatBox('Welcome to GangGPT Server!');
        });
        
        console.log('🚀 Server ready to accept connections!');
    } else {
        console.log('⏳ MP object not ready, retrying in 100ms...');  
        setTimeout(initializeWhenReady, 100);
    }
};

// Start initialization
setTimeout(initializeWhenReady, 100);

console.log('📦 Minimal GangGPT Package Loaded');
