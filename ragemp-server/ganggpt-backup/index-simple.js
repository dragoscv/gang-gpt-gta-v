/**
 * GangGPT RAGE:MP Package Entry Point (Simplified Version)
 * Based on working DiamondRP implementation
 */

console.log('📦 Loading GangGPT RAGE:MP Package (Simple Mode)...');

try {
  // Load the RAGE:MP specific entry point
  require('./ragemp-entry-simple.js');

} catch (error) {
  console.error('❌ Failed to load GangGPT:', error);
  console.log('🔄 Falling back to minimal mode...');

  // Minimal fallback for RAGE:MP
  if (typeof mp !== 'undefined') {
    mp.events.add('playerJoin', (player) => {
      player.outputChatBox('GangGPT System Loading...');
    });
  }
}
