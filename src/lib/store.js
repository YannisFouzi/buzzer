import { ActivePlayers } from 'boardgame.io/core';

const AVAILABLE_SOUNDS = ['sch', 'girou', 'laurent', 'mbappe'];

function logState(G) {
  console.log('=== Game State ===');
  console.log('Player Sounds:', JSON.stringify(G.playerSounds));
  console.log('Used Sounds:', JSON.stringify(G.usedSounds));
}

function assignSound(G, ctx, playerID) {
  // VÉRIFICATION #0: Ne pas assigner de son à l'hôte (playerID 0)
  if (playerID === '0') {
    console.log("Pas de son pour l'hôte");
    return;
  }

  // Initialiser les states si nécessaire
  if (!G.playerSounds) G.playerSounds = {};
  if (!G.usedSounds) G.usedSounds = [];

  // VÉRIFICATION #1: Si le joueur a déjà un son, l'utiliser
  if (G.playerSounds[playerID]) {
    const existingSound = G.playerSounds[playerID];
    console.log(`Son existant ${existingSound} pour le joueur ${playerID}`);
    logState(G);
    return;
  }

  // VÉRIFICATION #2: Si tous les sons sont utilisés, on reset
  if (G.usedSounds.length >= AVAILABLE_SOUNDS.length) {
    console.log('Réinitialisation des sons utilisés');
    G.usedSounds = [];
  }

  // VÉRIFICATION #3: Créer une copie des sons disponibles
  const usedSoundsSet = new Set(G.usedSounds);
  const availableSounds = AVAILABLE_SOUNDS.filter(
    (sound) => !usedSoundsSet.has(sound)
  );

  // VÉRIFICATION #4: On s'assure qu'il y a des sons disponibles
  if (availableSounds.length === 0) {
    console.error('Plus de sons disponibles!');
    logState(G);
    return;
  }

  // Attribution du son de manière déterministe
  const soundIndex = parseInt(playerID) % availableSounds.length;
  const selectedSound = availableSounds[soundIndex];

  // VÉRIFICATION #5: Double check avant d'assigner
  if (!usedSoundsSet.has(selectedSound)) {
    // On met à jour le state du jeu de manière atomique
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
  const newQueue = {
    ...G.queue,
  };
  if (!newQueue[id]) {
    newQueue[id] = { id, timestamp: new Date().getTime() };
  }
  G.queue = newQueue;
}

export const Buzzer = {
  name: 'buzzer',
  minPlayers: 2,
  maxPlayers: 200,

  setup: () => ({
    queue: {},
    locked: false,
    playerSounds: {},
    usedSounds: [],
  }),

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
