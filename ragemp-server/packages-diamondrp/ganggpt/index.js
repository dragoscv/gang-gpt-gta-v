/**
 * GangGPT RAGE:MP Package Entry Point
 * This package integrates GangGPT AI system with RAGE:MP server
 */

console.log('📦 Loading GangGPT RAGE:MP Package...');

try {
  // Load the RAGE:MP specific entry point
  require('./ragemp-entry.js');

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
