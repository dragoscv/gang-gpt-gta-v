/**
 * GangGPT Client-Side Script
 * Handles player interactions with the AI-powered server
 */

// Server communication
let serverState = {
  connected: false,
  playerId: null,
  characterId: null,
  faction: null
};

// UI Elements
let chatBox = null;
let aiInteractionUI = null;

/**
 * Initialize client-side systems
 */
mp.events.add('clientInit', () => {
  mp.gui.chat.push('Welcome to GangGPT - AI-Powered Roleplay Server!');
  mp.gui.chat.push('Type /help for available commands');

  // Initialize UI systems
  initializeChatSystem();
  initializeAISystem();
  initializeControls();

  // Request server data
  mp.events.callRemote('client:requestPlayerData');
});

/**
 * Initialize chat system
 */
function initializeChatSystem() {
  // Enhanced chat with AI integration
  mp.events.add('chatMessage', (player, message) => {
    const playerName = player.name || 'Unknown';
    mp.gui.chat.push(`${playerName}: ${message}`);
  });

  // AI companion messages
  mp.events.add('aiMessage', (npcName, message, messageType = 'normal') => {
    const colorCode = messageType === 'system' ? '!{#FFD700}' : '!{#87CEEB}';
    mp.gui.chat.push(`${colorCode}[AI] ${npcName}: ${message}`);
  });
}

/**
 * Initialize AI interaction system
 */
function initializeAISystem() {
  // Handle AI NPC interactions
  mp.events.add('startAIInteraction', (npcId, npcName, context) => {
    // Open AI interaction dialog
    if (aiInteractionUI) {
      aiInteractionUI.destroy();
    }

    // Create simple interaction interface
    mp.gui.chat.push(`!{#FFD700}Started conversation with ${npcName}`);
    mp.gui.chat.push(`!{#FFD700}Type your message to interact, or /end to stop talking`);

    serverState.currentNPC = { id: npcId, name: npcName };
  });

  mp.events.add('endAIInteraction', () => {
    if (serverState.currentNPC) {
      mp.gui.chat.push(`!{#FFD700}Ended conversation with ${serverState.currentNPC.name}`);
      serverState.currentNPC = null;
    }
  });
}

/**
 * Initialize player controls
 */
function initializeControls() {
  // Register key bindings
  mp.keys.bind(0x54, true, () => { // T key
    mp.gui.chat.activate(true);
  });

  // Handle player movement updates
  let lastPosition = { x: 0, y: 0, z: 0 };
  setInterval(() => {
    if (mp.players.local.position) {
      const pos = mp.players.local.position;
      const distance = getDistance(pos, lastPosition);

      if (distance > 5) { // Update every 5 units
        mp.events.callRemote('player:updatePosition', pos.x, pos.y, pos.z);
        lastPosition = { x: pos.x, y: pos.y, z: pos.z };
      }
    }
  }, 1000);
}

/**
 * Handle chat commands
 */
mp.events.add('playerCommand', (command) => {
  const args = command.split(' ');
  const cmd = args[0].toLowerCase();

  switch (cmd) {
    case 'help':
      showHelpCommands();
      break;

    case 'ai':
      if (args.length < 2) {
        mp.gui.chat.push('!{#FF0000}Usage: /ai <message>');
        return;
      }
      sendAIMessage(args.slice(1).join(' '));
      break;

    case 'faction':
      mp.events.callRemote('player:requestFactionInfo');
      break;

    case 'mission':
      mp.events.callRemote('player:requestMission');
      break;

    case 'stats':
      mp.events.callRemote('player:requestStats');
      break;

    case 'end':
      if (serverState.currentNPC) {
        mp.events.callRemote('ai:endInteraction', serverState.currentNPC.id);
      }
      break;

    default:
      mp.gui.chat.push(`!{#FF0000}Unknown command: /${cmd}`);
  }
});

/**
 * Show available commands
 */
function showHelpCommands() {
  mp.gui.chat.push('!{#00FF00}Available Commands:');
  mp.gui.chat.push('!{#FFFFFF}/ai <message> - Talk to nearby AI NPCs');
  mp.gui.chat.push('!{#FFFFFF}/faction - View faction information');
  mp.gui.chat.push('!{#FFFFFF}/mission - Request a new mission');
  mp.gui.chat.push('!{#FFFFFF}/stats - View your player stats');
  mp.gui.chat.push('!{#FFFFFF}/end - End current AI conversation');
  mp.gui.chat.push('!{#FFFFFF}/help - Show this help menu');
}

/**
 * Send message to AI system
 */
function sendAIMessage(message) {
  if (serverState.currentNPC) {
    mp.events.callRemote('ai:sendMessage', serverState.currentNPC.id, message);
  } else {
    mp.events.callRemote('ai:nearbyInteraction', message);
  }
}

/**
 * Handle server responses
 */
mp.events.add('server:playerData', (data) => {
  serverState.playerId = data.id;
  serverState.characterId = data.characterId;
  serverState.faction = data.faction;
  serverState.connected = true;

  mp.gui.chat.push(`!{#00FF00}Connected as ${data.name} (ID: ${data.id})`);
});

mp.events.add('server:factionInfo', (factionData) => {
  if (factionData) {
    mp.gui.chat.push(`!{#FFD700}Faction: ${factionData.name}`);
    mp.gui.chat.push(`!{#FFD700}Influence: ${factionData.influence}`);
    mp.gui.chat.push(`!{#FFD700}Territory: ${factionData.territory || 'None'}`);
  } else {
    mp.gui.chat.push('!{#FF0000}You are not in a faction');
  }
});

mp.events.add('server:missionAssigned', (missionData) => {
  mp.gui.chat.push(`!{#00FF00}New Mission: ${missionData.title}`);
  mp.gui.chat.push(`!{#FFFFFF}${missionData.description}`);
  mp.gui.chat.push(`!{#FFFF00}Reward: $${missionData.reward}`);

  // Add mission waypoint if location provided
  if (missionData.location) {
    mp.game.ui.setNewWaypoint(missionData.location.x, missionData.location.y);
    mp.gui.chat.push('!{#00FF00}Waypoint set to mission location');
  }
});

mp.events.add('server:playerStats', (stats) => {
  mp.gui.chat.push('!{#00FF00}Player Statistics:');
  mp.gui.chat.push(`!{#FFFFFF}Level: ${stats.level}`);
  mp.gui.chat.push(`!{#FFFFFF}Money: $${stats.money}`);
  mp.gui.chat.push(`!{#FFFFFF}Health: ${stats.health}/100`);
  mp.gui.chat.push(`!{#FFFFFF}Armor: ${stats.armor}/100`);
  mp.gui.chat.push(`!{#FFFFFF}Online Time: ${stats.onlineTime}`);
});

/**
 * Utility functions
 */
function getDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Handle player spawn
 */
mp.events.add('playerSpawn', () => {
  mp.gui.chat.push('!{#00FF00}You have spawned. Welcome to Los Santos!');

  // Set default spawn location (Los Santos Airport)
  if (!mp.players.local.position || (mp.players.local.position.x === 0 && mp.players.local.position.y === 0)) {
    mp.players.local.position = new mp.Vector3(-1037.97, -2738.84, 20.17);
  }
});

/**
 * Handle connection events
 */
mp.events.add('playerJoin', (player) => {
  if (player !== mp.players.local) {
    mp.gui.chat.push(`!{#87CEEB}${player.name} joined the server`);
  }
});

mp.events.add('playerQuit', (player, exitType, reason) => {
  mp.gui.chat.push(`!{#FF6B6B}${player.name} left the server`);
});

// Initialize when client loads
mp.events.add('render', () => {
  // Initialize client systems
  mp.events.call('clientInit');
});

mp.gui.chat.push('!{#00FF00}GangGPT client script loaded successfully!');
