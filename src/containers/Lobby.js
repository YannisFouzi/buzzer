import { get } from 'lodash';
import React, { useState } from 'react';
import { Container, Form } from 'react-bootstrap';
import { useHistory, useLocation } from 'react-router-dom';
import Footer from '../components/Footer.js';
import Header from '../components/Header.js';
import { createRoom, getRoom, joinRoom } from '../lib/endpoints.js';

const ERROR_TYPE = {
  emptyCode: 'emptyCode',
  roomCode: 'roomCode',
  name: 'name',
  hostRoom: 'hostRoom',
  fullRoom: 'fullRoom',
  dupName: 'dupName',
};

const ERROR_MESSAGE = {
  [ERROR_TYPE.emptyCode]: 'Please enter a room code',
  [ERROR_TYPE.roomCode]: 'Unable to join room with this code',
  [ERROR_TYPE.name]: 'Please enter your player name',
  [ERROR_TYPE.dupName]: 'Player name already taken',
  [ERROR_TYPE.hostRoom]: 'Unable to create room, please try again',
  [ERROR_TYPE.fullRoom]: 'Room has reached capacity',
};

export default function Lobby({ setAuth }) {
  const location = useLocation();
  const prefilledRoomID = get(location, 'state.roomID');

  const history = useHistory();
  const [name, setName] = useState('');
  const [room, setRoom] = useState(prefilledRoomID || '');
  const [joinMode, setJoinMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // enter room: find room, then join it
  async function enterRoom(roomId, hosting = false) {
    if (!hosting) {
      setLoading(true);
    }

    try {
      const roomRes = await getRoom(roomId);
      console.log('=== Room Response ===', roomRes);

      if (roomRes.status !== 200) {
        throw new Error(ERROR_TYPE.roomCode);
      }
      const room = roomRes.data;

      // determine seat to take
      const playerSeat = room.players.find((player) => player.name === name);
      const freeSeat = room.players.find((player) => !player.name);

      console.log('=== Player Assignment ===', {
        name,
        playerSeat,
        freeSeat,
        allPlayers: room.players,
      });

      if (playerSeat && playerSeat.connected) {
        throw new Error(ERROR_TYPE.dupName);
      }
      if (!playerSeat && !freeSeat) {
        throw new Error(ERROR_TYPE.fullRoom);
      }
      const playerID = get(playerSeat, 'id', get(freeSeat, 'id'));

      // join room
      const joinRes = await joinRoom(room.roomID, playerID, name);
      console.log('=== Join Response ===', joinRes);

      if (joinRes.status !== 200) {
        throw new Error(ERROR_TYPE.roomCode);
      }
      const auth = {
        playerID,
        credentials: joinRes.data.playerCredentials,
        roomID: room.roomID,
      };

      console.log('=== Final Auth ===', auth);
      setAuth(auth);
      setLoading(false);
      history.push(`/${room.roomID}`);
    } catch (error) {
      setLoading(false);
      setError(ERROR_MESSAGE[error.message]);
    }
  }

  // make room: create room, then join it
  async function makeRoom() {
    setLoading(true);
    try {
      const createRes = await createRoom();
      if (createRes.status !== 200) {
        throw new Error(ERROR_TYPE.hostRoom);
      }
      const roomID = createRes.data.gameID;
      await enterRoom(roomID, true);
    } catch (error) {
      setLoading(false);
      setError(ERROR_MESSAGE[error.message]);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    // validate room and/or player name has been filled
    if (joinMode) {
      if (room.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.emptyCode]);
      } else if (name.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.name]);
      } else if (room.trim().length !== 6) {
        setError(ERROR_MESSAGE[ERROR_TYPE.roomCode]);
      } else {
        enterRoom(room);
      }
    } else {
      if (name.trim().length === 0) {
        setError(ERROR_MESSAGE[ERROR_TYPE.name]);
      } else {
        makeRoom();
      }
    }
  }

  const form = joinMode ? (
    <Form className="lobby-form" onSubmit={(e) => handleSubmit(e)}>
      <h3>Join a game</h3>
      <Form.Group controlId="room">
        <Form.Label>Room code</Form.Label>
        <Form.Control
          value={room}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck="false"
          onChange={(e) => {
            setError('');
            setRoom(e.target.value);
          }}
        />
      </Form.Group>

      <Form.Group controlId="name">
        <Form.Label>Your name</Form.Label>
        <Form.Control
          value={name}
          onChange={(e) => {
            setError('');
            setName(e.target.value);
          }}
        />
      </Form.Group>

      <div className="error-message">{error}</div>
      <button type="submit" disabled={loading}>
        {loading ? 'Joining...' : 'Join'}
      </button>
      <div className="switcher">
        Hosting a game?{' '}
        <button
          className="inline"
          onClick={() => {
            setError('');
            setJoinMode(false);
          }}
        >
          Create room
        </button>
      </div>
    </Form>
  ) : (
    <Form className="lobby-form" onSubmit={(e) => handleSubmit(e)}>
      <h3>Host a game</h3>
      <Form.Group controlId="name">
        <Form.Label>Your name</Form.Label>
        <Form.Control
          value={name}
          onChange={(e) => {
            setError('');
            setName(e.target.value);
          }}
        />
      </Form.Group>

      <div className="error-message">{error}</div>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Host'}
      </button>
      <div className="switcher">
        Joining a game?{' '}
        <button
          className="inline"
          onClick={() => {
            setError('');
            setJoinMode(true);
          }}
        >
          Enter room
        </button>
      </div>
    </Form>
  );

  return (
    <main id="lobby">
      <section className="primary">
        <Header />
        <Container className="container-centered">{form}</Container>
      </section>
      <Footer mobileOnly />
    </main>
  );
}
