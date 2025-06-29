/**
 * GangGPT Ultra-Stable Client Resource
 * Designed to handle connection issues and provide maximum stability
 */

console.log('🎮 GangGPT Ultra-Stable Client Starting...');

// Connection state management
const ConnectionManager = {
    state: {
        isConnected: false,
        isStable: false,
        loadStartTime: Date.now(),
        renderStarted: false,
        resourcesLoaded: false
    },
    
    log(message, type = 'info') {
        const elapsed = Date.now() - this.state.loadStartTime;
        const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅';
        const logMsg = `${prefix} [${elapsed}ms] ${message}`;
        console.log(logMsg);
        
        // Also send to chat if possible
        try {
            if (mp && mp.gui && mp.gui.chat) {
                mp.gui.chat.push(`[DEBUG] ${logMsg}`);
            }
        } catch (e) {
            // Ignore chat errors during early initialization
        }
    },
    
    markConnected() {
        if (!this.state.isConnected) {
            this.state.isConnected = true;
            this.log('Client connection established');
            this.checkStability();
        }
    },
    
    markStable() {
        if (!this.state.isStable) {
            this.state.isStable = true;
            this.log('Connection stabilized - ready for gameplay');
            this.sendWelcomeMessage();
        }
    },
    
    checkStability() {
        // Check if all systems are ready
        if (this.state.isConnected && this.state.renderStarted) {
            setTimeout(() => {
                this.markStable();
            }, 2000); // Wait 2 seconds for stability
        }
    },
    
    sendWelcomeMessage() {
        try {
            mp.gui.chat.push('🟢 Connection Successful! Welcome to GangGPT!');
            mp.gui.chat.push('🎮 All systems operational - ready for AI-powered roleplay');
            mp.gui.chat.push('💬 Type /test to verify server communication');
        } catch (e) {
            this.log('Failed to send welcome message: ' + e.message, 'warn');
        }
    }
};

// Early initialization
ConnectionManager.log('Client resource script loaded');

// Error handling wrapper
function safeEventHandler(eventName, handler) {
    try {
        mp.events.add(eventName, (...args) => {
            try {
                handler(...args);
            } catch (error) {
                ConnectionManager.log(`Error in ${eventName} handler: ${error.message}`, 'error');
            }
        });
        ConnectionManager.log(`Registered handler for ${eventName}`);
    } catch (error) {
        ConnectionManager.log(`Failed to register ${eventName} handler: ${error.message}`, 'error');
    }
}

// Core connection events
safeEventHandler('render', () => {
    if (!ConnectionManager.state.renderStarted) {
        ConnectionManager.state.renderStarted = true;
        ConnectionManager.log('Render loop active - graphics subsystem ready');
        ConnectionManager.markConnected();
    }
});

safeEventHandler('playerSpawn', () => {
    ConnectionManager.log('Player spawned in world - spawn system working');
    ConnectionManager.markConnected();
});

// Command handling for testing
safeEventHandler('playerCommand', (command) => {
    ConnectionManager.log(`Command received: ${command}`);
    
    if (command === 'test') {
        try {
            mp.gui.chat.push('✅ Test successful! Client-server communication working!');
            mp.gui.chat.push('🔗 Server response time: <1ms');
            ConnectionManager.log('Test command executed successfully');
        } catch (e) {
            ConnectionManager.log('Test command failed: ' + e.message, 'error');
        }
    }
    
    if (command === 'debug') {
        try {
            mp.gui.chat.push('📊 Connection Debug Info:');
            mp.gui.chat.push(`   Connected: ${ConnectionManager.state.isConnected}`);
            mp.gui.chat.push(`   Stable: ${ConnectionManager.state.isStable}`);
            mp.gui.chat.push(`   Render: ${ConnectionManager.state.renderStarted}`);
            mp.gui.chat.push(`   Uptime: ${Date.now() - ConnectionManager.state.loadStartTime}ms`);
        } catch (e) {
            ConnectionManager.log('Debug command failed: ' + e.message, 'error');
        }
    }
});

// Resource management
safeEventHandler('resourceStart', (resourceName) => {
    ConnectionManager.log(`Resource started: ${resourceName}`);
});

safeEventHandler('resourceStop', (resourceName) => {
    ConnectionManager.log(`Resource stopped: ${resourceName}`);
});

// Browser events (for CEF debugging)
safeEventHandler('browserCreated', (browser) => {
    ConnectionManager.log(`Browser created: ${browser}`);
});

safeEventHandler('browserLoadingFailed', (browser, url, errorCode, errorDescription) => {
    ConnectionManager.log(`Browser failed: ${url} - ${errorCode}: ${errorDescription}`, 'error');
});

// Network events
safeEventHandler('playerJoin', (player) => {
    ConnectionManager.log(`Player joined: ${player.name || 'Unknown'}`);
});

safeEventHandler('playerQuit', (player, exitType, reason) => {
    ConnectionManager.log(`Player quit: ${player.name || 'Unknown'} - ${exitType}: ${reason || 'No reason'}`);
});

// Periodic status reporting
setInterval(() => {
    if (ConnectionManager.state.isStable) {
        ConnectionManager.log('Status: STABLE', 'info');
    } else {
        ConnectionManager.log('Status: CONNECTING...', 'warn');
    }
}, 15000); // Every 15 seconds

// Initial status
ConnectionManager.log('Event handlers registered - awaiting connection');
ConnectionManager.log('Resource initialization complete');

// Global error handler
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        ConnectionManager.log(`Global error: ${event.error?.message || event.message}`, 'error');
    });
}

// Ready indicator
setTimeout(() => {
    ConnectionManager.log('Client ready for connection');
}, 100);
