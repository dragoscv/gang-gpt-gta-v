/**
 * GangGPT RAGE:MP Package Entry Point
 * Integrates the GangGPT backend with RAGE:MP server
 */

console.log('🎮 Loading GangGPT RAGE:MP Package...');

// HTTP client for backend communication
const https = require('https');
const http = require('http');

// Backend API configuration
const BACKEND_URL = 'http://localhost:4828';

// Helper function to make HTTP requests to backend
function apiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4828,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GangGPT-RAGEMP/1.0.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve({ error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Check if mp object is available
if (typeof mp !== 'undefined') {
  console.log('✅ mp object available - Full RAGE:MP mode');
  // Register RAGE:MP events
  mp.events.add('playerJoin', async (player) => {
    console.log(`🎮 GangGPT: Player ${player.name} (ID: ${player.id}) joined the server`);
    console.log(`📊 Connection details: IP: ${player.ip}, Social Club: ${player.socialClub || 'N/A'}`);

    // Send player join event to backend
    try {
      await apiRequest('/api/game/player-join', 'POST', {
        playerId: player.id,
        playerName: player.name,
        playerIp: player.ip,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Successfully notified backend of player join: ${player.name}`);
    } catch (error) {
      console.log('⚠️ Failed to notify backend of player join:', error.message);
    }

    // Welcome message with AI features
    player.outputChatBox('🤖 Welcome to GangGPT! Use /ai [message] to chat with AI or /help for commands');
    player.outputChatBox('🎮 Connection successful! You are now in the AI-powered roleplay world.');
  });

  mp.events.add('playerQuit', async (player, exitType, reason) => {
    console.log(`🎮 GangGPT: Player ${player.name} (ID: ${player.id}) left the server`);
    console.log(`📊 Disconnect details: Type: ${exitType}, Reason: ${reason || 'No reason provided'}`);

    try {
      await apiRequest('/api/game/player-quit', 'POST', {
        playerId: player.id,
        playerName: player.name,
        exitType: exitType,
        reason: reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.log('⚠️ Failed to notify backend of player quit:', error.message);
    }
  });

  // Add connection debugging events
  mp.events.add('playerReady', (player) => {
    console.log(`🟢 Player ${player.name} is ready (resources loaded successfully)`);
  });

  mp.events.add('playerStreamIn', (player, forPlayer) => {
    console.log(`📡 Player ${player.name} streamed in for ${forPlayer.name}`);
  });

  mp.events.add('playerStreamOut', (player, forPlayer) => {
    console.log(`📡 Player ${player.name} streamed out for ${forPlayer.name}`);
  });

  mp.events.add('playerChat', async (player, message) => {
    console.log(`💬 ${player.name}: ${message}`);

    // Handle AI chat commands
    if (message.startsWith('/ai ')) {
      const aiMessage = message.substring(4);
      try {
        const response = await apiRequest('/api/game/ai-chat', 'POST', {
          playerId: player.id,
          playerName: player.name,
          message: aiMessage
        });

        if (response.reply) {
          player.outputChatBox(`🤖 AI: ${response.reply}`);
        } else {
          player.outputChatBox('🤖 AI: Sorry, I couldn\'t process that request.');
        }
      } catch (error) {
        player.outputChatBox('🤖 AI: System temporarily unavailable.');
      }
      return false; // Don't show the command in regular chat
    }

    // Handle help command
    if (message === '/help') {
      player.outputChatBox('🎮 GangGPT Commands:');
      player.outputChatBox('/ai [message] - Chat with AI');
      player.outputChatBox('/status - Server status');
      player.outputChatBox('/help - Show this help');
      return false;
    }

    // Handle status command
    if (message === '/status') {
      try {
        const status = await apiRequest('/health');
        player.outputChatBox(`🎮 Server Status: ${status.status || 'Unknown'}`);
      } catch (error) {
        player.outputChatBox('🎮 Server Status: Backend unavailable');
      }
      return false;
    }

    return true; // Allow regular chat
  });

  // Initialize server health check
  apiRequest('/health').then(response => {
    console.log('✅ Backend health check:', response.status || 'OK');
  }).catch(error => {
    console.log('⚠️ Backend health check failed:', error.message);
  });

} else {
  console.log('⚠️ mp object not available - Backend-only mode');

  // Still try to connect to backend for status
  apiRequest('/health').then(response => {
    console.log('✅ Backend connection successful:', response.status || 'OK');
  }).catch(error => {
    console.log('❌ Backend connection failed:', error.message);
  });
}

console.log('✅ GangGPT RAGE:MP Package loaded successfully');

// Export for RAGE:MP
module.exports = {
  name: 'GangGPT',
  version: '1.0.0',
  description: 'AI-powered GTA V multiplayer server',
  apiRequest: apiRequest
};
