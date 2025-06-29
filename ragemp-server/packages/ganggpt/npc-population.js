/**
 * GangGPT NPC Population System
 * Creates a living world with AI NPCs and traffic
 */

class NPCPopulationManager {
    constructor() {
        this.npcs = new Map();
        this.vehicles = new Map();
        this.maxNPCs = 50;
        this.maxVehicles = 30;
        this.spawnRadius = 500;
        this.despawnRadius = 800;
        
        this.npcModels = [
            'a_m_m_bevhills_01', 'a_m_m_business_01', 'a_m_m_downtown_01',
            'a_m_y_business_01', 'a_m_y_downtown_01', 'a_f_m_bevhills_01',
            'a_f_m_business_02', 'a_f_y_business_01', 'a_f_y_downtown_01',
            'ig_barry', 'ig_bestmen', 'ig_beverly', 'ig_car3guy1',
            'ig_casey', 'ig_chef', 'ig_cletus', 'ig_dale', 'ig_davenport'
        ];
        
        this.vehicleModels = [
            'adder', 'blista', 'buffalo', 'carbonizzare', 'comet2',
            'exemplar', 'feltzer2', 'furoregt', 'jester', 'kuruma',
            'massacro', 'ninef', 'rapidgt', 'surano', 'vacca',
            'voltic', 'zentorno', 'baller', 'cavalcade', 'granger',
            'huntley', 'landstalker', 'mesa', 'patriot', 'radi',
            'serrano', 'xls', 'akuma', 'bagger', 'bati',
            'carbonrs', 'daemon', 'double', 'faggio2', 'hakuchou'
        ];
        
        this.spawnPoints = [
            // Los Santos spawn points
            { x: -1037.5, y: -2737.6, z: 20.2 },  // Airport
            { x: 213.0, y: -1638.9, z: 29.8 },    // Downtown
            { x: -724.6, y: -1444.0, z: 5.0 },    // Vespucci Beach
            { x: 1135.7, y: -982.3, z: 46.4 },    // Mirror Park
            { x: -1304.9, y: -394.0, z: 36.7 },   // Rockford Hills
            { x: -47.3, y: -1757.5, z: 29.4 },    // Grove Street
            { x: 1981.4, y: 3053.0, z: 47.2 },    // Sandy Shores
            { x: -2196.5, y: 4244.8, z: 48.1 },   // Paleto Bay
            { x: 1692.6, y: 4875.7, z: 42.1 },    // Grapeseed
            { x: -1119.8, y: 2693.3, z: 18.6 }    // Zancudo
        ];
    }

    initialize() {
        console.log('🌍 Initializing NPC Population System...');
        
        // Start population management
        this.startPopulationLoop();
        
        // Add command for manual NPC spawning
        mp.events.add('playerCommand', (player, command) => {
            const args = command.split(' ');
            
            if (args[0] === 'spawn_npcs') {
                const count = parseInt(args[1]) || 10;
                this.spawnNPCsAroundPlayer(player, count);
                player.outputChatBox(`!{#00ff00}Spawned ${count} NPCs around you!`);
            }
            
            if (args[0] === 'spawn_traffic') {
                const count = parseInt(args[1]) || 5;
                this.spawnTrafficAroundPlayer(player, count);
                player.outputChatBox(`!{#00ff00}Spawned ${count} traffic vehicles around you!`);
            }
            
            if (args[0] === 'clear_npcs') {
                this.clearAllNPCs();
                player.outputChatBox('!{#ff0000}Cleared all NPCs and vehicles!');
            }
        });
        
        console.log('✅ NPC Population System initialized!');
    }

    startPopulationLoop() {
        // Check and manage population every 5 seconds
        setInterval(() => {
            this.managePedestrians();
            this.manageTraffic();
        }, 5000);
        
        // Initial spawn
        setTimeout(() => {
            this.initialWorldPopulation();
        }, 2000);
    }

    initialWorldPopulation() {
        console.log('🏙️ Populating initial world...');
        
        // Spawn NPCs at each spawn point
        this.spawnPoints.forEach(point => {
            this.spawnNPCsAtLocation(point, 5);
            this.spawnTrafficAtLocation(point, 3);
        });
        
        console.log(`✅ World populated with ${this.npcs.size} NPCs and ${this.vehicles.size} vehicles`);
    }

    spawnNPCsAroundPlayer(player, count = 10) {
        const pos = player.position;
        this.spawnNPCsAtLocation(pos, count);
    }

    spawnNPCsAtLocation(location, count) {
        for (let i = 0; i < count; i++) {
            if (this.npcs.size >= this.maxNPCs) break;
            
            const model = this.npcModels[Math.floor(Math.random() * this.npcModels.length)];
            const offsetX = (Math.random() - 0.5) * 200;
            const offsetY = (Math.random() - 0.5) * 200;
            
            try {
                const npc = mp.peds.new(mp.joaat(model), new mp.Vector3(
                    location.x + offsetX,
                    location.y + offsetY,
                    location.z
                ), {
                    heading: Math.random() * 360,
                    dimension: 0
                });
                
                if (npc) {
                    npc.setInvincible(true);
                    npc.freezePosition(false);
                    
                    // Give NPC some basic AI behavior
                    this.giveNPCBehavior(npc);
                    
                    this.npcs.set(npc.id, {
                        ped: npc,
                        spawnTime: Date.now(),
                        behavior: this.getRandomBehavior()
                    });
                }
            } catch (error) {
                console.log(`❌ Failed to spawn NPC: ${error.message}`);
            }
        }
    }

    spawnTrafficAroundPlayer(player, count = 5) {
        const pos = player.position;
        this.spawnTrafficAtLocation(pos, count);
    }

    spawnTrafficAtLocation(location, count) {
        for (let i = 0; i < count; i++) {
            if (this.vehicles.size >= this.maxVehicles) break;
            
            const model = this.vehicleModels[Math.floor(Math.random() * this.vehicleModels.length)];
            const offsetX = (Math.random() - 0.5) * 300;
            const offsetY = (Math.random() - 0.5) * 300;
            
            try {
                const vehicle = mp.vehicles.new(mp.joaat(model), new mp.Vector3(
                    location.x + offsetX,
                    location.y + offsetY,
                    location.z
                ), {
                    heading: Math.random() * 360,
                    dimension: 0,
                    color: [[Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]]
                });
                
                if (vehicle) {
                    // Sometimes add a driver
                    if (Math.random() < 0.7) {
                        const driverModel = this.npcModels[Math.floor(Math.random() * this.npcModels.length)];
                        const driver = mp.peds.new(mp.joaat(driverModel), vehicle.position, {
                            heading: 0,
                            dimension: 0
                        });
                        
                        if (driver) {
                            driver.putIntoVehicle(vehicle, -1);
                            driver.setInvincible(true);
                        }
                    }
                    
                    this.vehicles.set(vehicle.id, {
                        vehicle: vehicle,
                        spawnTime: Date.now()
                    });
                }
            } catch (error) {
                console.log(`❌ Failed to spawn vehicle: ${error.message}`);
            }
        }
    }

    giveNPCBehavior(npc) {
        // Random walking behavior
        const behaviors = ['WORLD_HUMAN_HANG_OUT_STREET', 'WORLD_HUMAN_SMOKING', 'WORLD_HUMAN_STAND_MOBILE'];
        const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        
        setTimeout(() => {
            try {
                npc.taskStartScenarioInPlace(behavior, -1, true);
            } catch (error) {
                // Fallback to basic wandering
                npc.taskWanderStandard(10.0, 10);
            }
        }, 1000);
    }

    getRandomBehavior() {
        const behaviors = ['wandering', 'standing', 'talking', 'smoking', 'phone'];
        return behaviors[Math.floor(Math.random() * behaviors.length)];
    }

    managePedestrians() {
        // Remove NPCs that are too old or too far
        for (const [id, npcData] of this.npcs) {
            if (!npcData.ped.handle || Date.now() - npcData.spawnTime > 300000) { // 5 minutes
                this.removeNPC(id);
            }
        }
        
        // Spawn new NPCs if needed
        if (this.npcs.size < this.maxNPCs / 2) {
            const randomSpawn = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
            this.spawnNPCsAtLocation(randomSpawn, 5);
        }
    }

    manageTraffic() {
        // Remove old vehicles
        for (const [id, vehicleData] of this.vehicles) {
            if (!vehicleData.vehicle.handle || Date.now() - vehicleData.spawnTime > 600000) { // 10 minutes
                this.removeVehicle(id);
            }
        }
        
        // Spawn new traffic if needed
        if (this.vehicles.size < this.maxVehicles / 2) {
            const randomSpawn = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
            this.spawnTrafficAtLocation(randomSpawn, 3);
        }
    }

    removeNPC(id) {
        const npcData = this.npcs.get(id);
        if (npcData && npcData.ped.handle) {
            npcData.ped.destroy();
        }
        this.npcs.delete(id);
    }

    removeVehicle(id) {
        const vehicleData = this.vehicles.get(id);
        if (vehicleData && vehicleData.vehicle.handle) {
            vehicleData.vehicle.destroy();
        }
        this.vehicles.delete(id);
    }

    clearAllNPCs() {
        // Clear all NPCs
        for (const [id, npcData] of this.npcs) {
            if (npcData.ped.handle) {
                npcData.ped.destroy();
            }
        }
        this.npcs.clear();
        
        // Clear all vehicles
        for (const [id, vehicleData] of this.vehicles) {
            if (vehicleData.vehicle.handle) {
                vehicleData.vehicle.destroy();
            }
        }
        this.vehicles.clear();
        
        console.log('🧹 All NPCs and vehicles cleared');
    }

    getStats() {
        return {
            npcs: this.npcs.size,
            vehicles: this.vehicles.size,
            maxNPCs: this.maxNPCs,
            maxVehicles: this.maxVehicles
        };
    }
}

// Export for use in main GangGPT system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NPCPopulationManager;
}

// Initialize if running in RAGE:MP
if (typeof mp !== 'undefined') {
    const npcManager = new NPCPopulationManager();
    npcManager.initialize();
    
    // Add to global for access
    global.npcManager = npcManager;
}
