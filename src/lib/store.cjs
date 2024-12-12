const { ActivePlayers } = require('boardgame.io/core');

const AVAILABLE_SOUNDS = ['sch', 'girou', 'laurent', 'mbappe'];

// ... reste du code ...

const Buzzer = {
  name: 'buzzer',
  minPlayers: 2,
  maxPlayers: 200,
  // ... reste du code ...
};

module.exports = { Buzzer };
