import { Howl } from 'howler';
import { get, isEmpty, orderBy, round, some, sortBy, values } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import { AiOutlineDisconnect } from 'react-icons/ai';
import Header from '../components/Header.js';

export default function Table(game) {
  console.log('=== Table Component Mount ===');
  console.log('Game props:', {
    playerID: game.playerID,
    gameMetadata: game.gameMetadata,
    G: game.G,
  });

  const [loaded, setLoaded] = useState(false);
  const [buzzed, setBuzzer] = useState(
    game.G?.queue ? some(game.G.queue, (o) => o.id === game.playerID) : false
  );
  const [lastBuzz, setLastBuzz] = useState(null);
  const [sound, setSound] = useState(false);
  const buzzButton = useRef(null);
  const queueRef = useRef(null);
  const [buzzSound, setBuzzSound] = useState(null);

  // Déplacer la logique de l'hôte ici, avant les useEffect
  const players = !game.gameMetadata
    ? []
    : game.gameMetadata
        .filter((p) => p.name)
        .map((p) => ({ ...p, id: String(p.id) }));

  const firstPlayer =
    get(
      sortBy(players, (p) => parseInt(p.id, 10)).filter((p) => p.connected),
      '0'
    ) || null;
  const isHost = get(firstPlayer, 'id') === game.playerID;

  // D'abord assigner le son
  useEffect(() => {
    if (!game?.G) return;
    if (isHost) return;
    if (buzzSound) return;

    // Assigner un son seulement si nécessaire
    if (!game.G.playerSounds?.[game.playerID]) {
      console.log('Demande attribution son pour joueur', game.playerID);
      game.moves.assignSound(game.playerID);
    } else {
      console.log(
        `Son déjà assigné pour le joueur ${game.playerID}: ${
          game.G.playerSounds[game.playerID]
        }`
      );
    }
  }, [game?.G, game.playerID, isHost, buzzSound, game.moves]);

  // Ensuite créer l'objet Howl
  useEffect(() => {
    if (!game?.G) return;
    if (isHost) return;
    if (!game.G.playerSounds?.[game.playerID]) return;
    if (buzzSound) return;

    const currentSound = game.G.playerSounds[game.playerID];
    console.log('Création du son pour le joueur:', currentSound);

    const sound = new Howl({
      src: [`${process.env.PUBLIC_URL}/${currentSound}.mp3`],
      volume: 0.5,
      rate: 1.0,
    });

    setBuzzSound(sound);
  }, [
    game?.G?.playerSounds?.[game.playerID],
    buzzSound,
    isHost,
    game.G,
    game.playerID,
  ]);

  const playSound = useCallback(() => {
    if (
      sound &&
      isEmpty(queueRef.current) &&
      game.G?.queue?.[game.playerID] &&
      buzzSound
    ) {
      buzzSound.play();
    }
  }, [sound, game.G?.queue, game.playerID, buzzSound]);

  useEffect(() => {
    if (!game.G?.queue) return;

    console.log(game.G.queue, Date.now());
    if (!game.G.queue[game.playerID]) {
      if (lastBuzz && Date.now() - lastBuzz < 500) {
        setTimeout(() => {
          const queue = queueRef.current;
          if (queue && !queue[game.playerID]) {
            setBuzzer(false);
          }
        }, 500);
      } else {
        setBuzzer(false);
      }
    }

    if (loaded) {
      playSound();
    }

    if (!loaded) {
      setLoaded(true);
    }

    queueRef.current = game.G.queue;
  }, [game.G?.queue, loaded, lastBuzz, game.playerID, playSound]);

  const attemptBuzz = () => {
    if (!buzzed) {
      playSound();
      game.moves.buzz(game.playerID);
      setBuzzer(true);
      setLastBuzz(Date.now());
    }
  };

  // spacebar will buzz
  useEffect(() => {
    function onKeydown(e) {
      if (e.keyCode === 32 && !e.repeat) {
        buzzButton.current.click();
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);

  const queue = game.G?.queue
    ? sortBy(values(game.G.queue), ['timestamp'])
    : [];
  const buzzedPlayers = queue
    .map((p) => {
      const player = players.find((player) => player.id === p.id);
      if (!player) {
        return {};
      }
      return {
        ...p,
        name: player.name,
        connected: player.connected,
      };
    })
    .filter((p) => p.name);
  // active players who haven't buzzed
  const activePlayers = orderBy(
    players.filter((p) => !some(queue, (q) => q.id === p.id) && p.id !== '0'),
    ['connected', 'name'],
    ['desc', 'asc']
  );

  const timeDisplay = (delta) => {
    if (delta > 1000) {
      return `+${round(delta / 1000, 2)} s`;
    }
    return `+${delta} ms`;
  };

  return (
    <div>
      <Header
        auth={game.headerData}
        clearAuth={() =>
          game.headerData.setAuth({
            playerID: null,
            credentials: null,
            roomID: null,
          })
        }
        sound={sound}
        setSound={() => setSound(!sound)}
      />
      <Container>
        <section>
          <p id="room-title">Room {game.gameID}</p>
          {!game.isConnected ? (
            <p className="warning">Disconnected - attempting to reconnect...</p>
          ) : null}
          {!isHost ? (
            <div id="buzzer">
              <button
                ref={buzzButton}
                disabled={buzzed || game.G?.locked}
                onClick={() => {
                  if (!buzzed && !game.G?.locked) {
                    attemptBuzz();
                  }
                }}
              >
                {game.G?.locked ? 'Locked' : buzzed ? 'Buzzed' : 'Buzz'}
              </button>
            </div>
          ) : null}
          {isHost ? (
            <div className="settings">
              <div className="button-container">
                <button
                  className="text-button"
                  onClick={() => game.moves.toggleLock()}
                >
                  {game.G?.locked ? 'Unlock buzzers' : 'Lock buzzers'}
                </button>
              </div>
              <div className="button-container">
                <button
                  disabled={!game.G?.queue || isEmpty(game.G.queue)}
                  onClick={() => game.moves.resetBuzzers()}
                >
                  Reset all buzzers
                </button>
              </div>
              <div className="divider" />
            </div>
          ) : null}
        </section>
        <div className="queue">
          <p>Players Buzzed</p>
          <ul>
            {buzzedPlayers.map(({ id, name, timestamp, connected }, i) => (
              <li key={id} className={isHost ? 'resettable' : null}>
                <div
                  className="player-sign"
                  onClick={() => {
                    if (isHost) {
                      game.moves.resetBuzzer(id);
                    }
                  }}
                >
                  <div className={`name ${!connected ? 'dim' : ''}`}>
                    {name}
                    {!connected ? (
                      <AiOutlineDisconnect className="disconnected" />
                    ) : (
                      ''
                    )}
                  </div>
                  {i > 0 && queue[0] ? (
                    <div className="mini">
                      {timeDisplay(timestamp - queue[0].timestamp)}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="queue">
          <p>Other Players</p>
          <ul>
            {activePlayers.map(({ id, name, connected }) => (
              <li key={id}>
                <div className={`name ${!connected ? 'dim' : ''}`}>
                  {name}
                  {!connected ? (
                    <AiOutlineDisconnect className="disconnected" />
                  ) : (
                    ''
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </div>
  );
}
