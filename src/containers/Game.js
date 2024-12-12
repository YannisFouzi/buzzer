import { SocketIO } from 'boardgame.io/multiplayer';
import { Client } from 'boardgame.io/react';
import React from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import Header from '../components/Header.js';
import Table from '../components/Table.js';
import { GAME_SERVER } from '../lib/endpoints.js';
import { Buzzer } from '../lib/store.js';

export default function Game({ auth, setAuth }) {
  const { id: roomID } = useParams();

  const loadingComponent = () => (
    <div>
      <Header
        auth={auth}
        clearAuth={() =>
          setAuth({
            playerID: null,
            credentials: null,
            roomID: null,
          })
        }
      />
      <Container className="container-loading">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </Container>
    </div>
  );

  console.log('=== Game Component ===');
  console.log('Auth:', auth);
  console.log('RoomID:', roomID);

  if (auth.playerID === null || auth.playerID === undefined) {
    console.error('No playerID in auth!');
    return loadingComponent();
  }

  const clientConfig = {
    game: Buzzer,
    board: Table,
    multiplayer: SocketIO({
      server: GAME_SERVER,
      socketOpts: {
        transports: ['websocket'],
      },
    }),
    debug: false,
  };

  console.log('=== Creating Game Client ===', {
    config: clientConfig,
    roomID,
    playerID: String(auth.playerID),
    credentials: auth.credentials,
  });

  const App = Client(clientConfig);

  return (
    <main id="game">
      <div className="primary">
        <App
          gameID={roomID}
          playerID={String(auth.playerID)}
          credentials={auth.credentials}
          headerData={{ ...auth, setAuth }}
        />
      </div>
    </main>
  );
}
