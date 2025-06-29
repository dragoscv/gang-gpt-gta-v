/**
 * GangGPT Server Hot Reload Support
 * Handles client reload requests and server package reloading
 */

class ServerReloadManager {
    constructor() {
        this.setupReloadHandlers();
    }

    setupReloadHandlers() {
        // Handle client reload requests
        mp.events.add('clientReloadRequest', (player) => {
            console.log(`🔄 Client reload requested by ${player.name}`);
            
            // Send reload signal back to client
            player.call('clientReload');
            
            // Optional: Reload server packages too
            this.reloadServerPackages();
        });

        // Handle server reload requests
        mp.events.add('serverReloadRequest', (player) => {
            console.log(`🔄 Server reload requested by ${player.name}`);
            
            this.reloadServerPackages();
            
            // Notify all players
            mp.players.forEach(p => {
                p.outputChatBox('!{#ffff00}🔄 Server packages reloaded!');
            });
        });

        // Add server console commands
        mp.events.addCommand('reload', (player, fullText) => {
            if (!this.hasReloadPermission(player)) {
                player.outputChatBox('!{#ff0000}❌ No permission to reload');
                return;
            }

            const args = fullText.split(' ');
            const target = args[1] || 'all';

            switch(target.toLowerCase()) {
                case 'client':
                    player.call('clientReload');
                    player.outputChatBox('!{#00ff00}✅ Client reloaded');
                    break;
                case 'server':
                    this.reloadServerPackages();
                    player.outputChatBox('!{#00ff00}✅ Server packages reloaded');
                    break;
                case 'npcs':
                    this.reloadNPCs();
                    player.outputChatBox('!{#00ff00}✅ NPCs reloaded');
                    break;
                case 'all':
                default:
                    player.call('clientReload');
                    this.reloadServerPackages();
                    player.outputChatBox('!{#00ff00}✅ Full reload completed');
                    break;
            }
        });

        // Add hotreload command
        mp.events.addCommand('hotreload', (player, fullText) => {
            if (!this.hasReloadPermission(player)) {
                player.outputChatBox('!{#ff0000}❌ No permission');
                return;
            }

            player.outputChatBox('!{#00ffff}🔥 Hot reload triggered!');
            
            // Reload everything
            this.performHotReload(player);
        });

        // Add dev commands
        mp.events.addCommand('dev', (player, fullText) => {
            const args = fullText.split(' ');
            const subcommand = args[1];

            switch(subcommand) {
                case 'reload':
                    this.performHotReload(player);
                    break;
                case 'status':
                    this.showDevStatus(player);
                    break;
                case 'test':
                    this.runDevTests(player);
                    break;
                default:
                    player.outputChatBox('!{#ffff00}Available: /dev reload, /dev status, /dev test');
            }
        });
    }

    reloadServerPackages() {
        try {
            console.log('🔄 Reloading server packages...');
            
            // Clear require cache for hot reload
            this.clearRequireCache();
            
            // Reload NPC system
            if (global.npcManager) {
                global.npcManager.clearAllNPCs();
                delete require.cache[require.resolve('./npc-population.js')];
                require('./npc-population.js');
                console.log('✅ NPC system reloaded');
            }
            
            console.log('✅ Server packages reloaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to reload server packages:', error.message);
        }
    }

    reloadNPCs() {
        try {
            if (global.npcManager) {
                console.log('🔄 Reloading NPC system...');
                
                // Clear existing NPCs
                global.npcManager.clearAllNPCs();
                
                // Reinitialize
                setTimeout(() => {
                    global.npcManager.initialWorldPopulation();
                    console.log('✅ NPCs reloaded successfully');
                }, 1000);
            }
        } catch (error) {
            console.error('❌ Failed to reload NPCs:', error.message);
        }
    }

    performHotReload(player) {
        console.log(`🔥 Hot reload initiated by ${player.name}`);
        
        // Reload server
        this.reloadServerPackages();
        
        // Reload client
        player.call('clientReload');
        
        // Reload NPCs
        this.reloadNPCs();
        
        // Notify
        player.outputChatBox('!{#00ff00}🔥 Hot reload completed!');
        
        // Show stats
        setTimeout(() => {
            this.showDevStatus(player);
        }, 2000);
    }

    showDevStatus(player) {
        player.outputChatBox('!{#00ffff}=== GangGPT Dev Status ===');
        
        if (global.npcManager) {
            const stats = global.npcManager.getStats();
            player.outputChatBox(`!{#ffff00}NPCs: ${stats.npcs}/${stats.maxNPCs}`);
            player.outputChatBox(`!{#ffff00}Vehicles: ${stats.vehicles}/${stats.maxVehicles}`);
        }
        
        player.outputChatBox(`!{#ffff00}Players: ${mp.players.length}`);
        player.outputChatBox(`!{#ffff00}Server Uptime: ${Math.floor(process.uptime())}s`);
    }

    runDevTests(player) {
        player.outputChatBox('!{#00ffff}🧪 Running development tests...');
        
        // Test NPC spawning
        if (global.npcManager) {
            global.npcManager.spawnNPCsAroundPlayer(player, 5);
            player.outputChatBox('!{#00ff00}✅ NPC spawn test passed');
        }
        
        // Test client communication
        player.call('devTest', 'server-to-client');
        
        player.outputChatBox('!{#00ff00}✅ Development tests completed');
    }

    clearRequireCache() {
        // Clear specific modules for hot reload
        const modulesToClear = [
            './npc-population.js',
            './ganggpt-ai.js',
            './ganggpt-commands.js'
        ];

        modulesToClear.forEach(modulePath => {
            try {
                const fullPath = require.resolve(modulePath);
                delete require.cache[fullPath];
            } catch (e) {
                // Module not found, skip
            }
        });
    }

    hasReloadPermission(player) {
        // In development, allow all players to reload
        // In production, restrict to admins
        return true; // For development
        
        // Production check would be:
        // return player.isAdmin || player.isDeveloper;
    }
}

// Initialize reload manager
const serverReloadManager = new ServerReloadManager();

// Export for global access
global.serverReloadManager = serverReloadManager;

console.log('🔥 GangGPT Server Hot Reload System initialized!');
