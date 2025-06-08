/**
 * GangGPT RAGE:MP Package Entry Point
 * Integrates the GangGPT backend with RAGE:MP server
 */

console.log('🎮 Loading GangGPT RAGE:MP Package...');

// Load the compiled TypeScript backend
require('../../../dist/index.js');

// Register basic RAGE:MP events for package verification
mp.events.add('playerJoin', (player) => {
  console.log(`🎮 GangGPT: Player ${player.name} joined the server`);
});

mp.events.add('playerQuit', (player, exitType, reason) => {
  console.log(`🎮 GangGPT: Player ${player.name} left the server`);
});

console.log('✅ GangGPT RAGE:MP Package loaded successfully');

// Export for RAGE:MP
module.exports = {
  name: 'GangGPT',
  version: '1.0.0',
  description: 'AI-powered GTA V multiplayer server'
};
