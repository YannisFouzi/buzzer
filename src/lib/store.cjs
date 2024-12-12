const { ActivePlayers } = require('boardgame.io/core');

const AVAILABLE_SOUNDS = ['sch', 'girou', 'laurent', 'mbappe'];

function logState(G) {
  console.log('=== Game State ===');
  console.log('Player Sounds:', JSON.stringify(G.playerSounds));
  console.log('Used Sounds:', JSON.stringify(G.usedSounds));
}

function assignSound(G, ctx, playerID) {
  if (playerID === '0') {
    console.log("Pas de son pour l'hôte");
    return;
  }

  if (!G.playerSounds) G.playerSounds = {};
  if (!G.usedSounds) G.usedSounds = [];

  if (G.playerSounds[playerID]) {
    const existingSound = G.playerSounds[playerID];
    console.log(`Son existant ${existingSound} pour le joueur ${playerID}`);
    logState(G);
    return;
  }

  if (G.usedSounds.length >= AVAILABLE_SOUNDS.length) {
    console.log('Réinitialisation des sons utilisés');
    G.usedSounds = [];
  }

  const usedSoundsSet = new Set(G.usedSounds);
  const availableSounds = AVAILABLE_SOUNDS.filter(
    (sound) => !usedSoundsSet.has(sound)
  );

  if (availableSounds.length === 0) {
    console.error('Plus de sons disponibles!');
    logState(G);
    return;
  }

  const soundIndex = parseInt(playerID) % availableSounds.length;
  const selectedSound = availableSounds[soundIndex];

  if (!usedSoundsSet.has(selectedSound)) {
    G.playerSounds[playerID] = selectedSound;
    G.usedSounds.push(selectedSound);
    console.log(`Son ${selectedSound} assigné au joueur ${playerID}`);
    logState(G);
  }
}

function resetBuzzers(G) {
  G.queue = {};
}

function resetBuzzer(G, ctx, id) {
  const newQueue = { ...G.queue };
  delete newQueue[id];
  G.queue = newQueue;
}

function toggleLock(G) {
  G.locked = !G.locked;
}

function buzz(G, ctx, id) {
  const newQueue = { ...G.queue };
  if (!newQueue[id]) {
    newQueue[id] = { id, timestamp: new Date().getTime() };
  }
  G.queue = newQueue;
}

const Buzzer = {
  name: 'buzzer',
  minPlayers: 2,
  maxPlayers: 200,

  setup: () => ({
    queue: {},
    locked: false,
    playerSounds: {},
    usedSounds: [],
  }),

  turn: {
    activePlayers: ActivePlayers.ALL,
  },

  phases: {
    play: {
      start: true,
      moves: { buzz, resetBuzzer, resetBuzzers, toggleLock, assignSound },
      turn: {
        activePlayers: ActivePlayers.ALL,
      },
    },
  },
};

module.exports = { Buzzer };
