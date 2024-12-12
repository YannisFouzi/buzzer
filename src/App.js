import { get, isNil } from 'lodash';
import React, { useState } from 'react';
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from 'react-router-dom';

import './App.css';
import Game from './containers/Game.js';
import Lobby from './containers/Lobby.js';

function App() {
  const [auth, setAuth] = useState({
    playerID: null,
    credentials: null,
    roomID: null,
  });

  return (
    <div className="App">
      <Router>
        <Switch>
          <Route
            path="/:id"
            render={({ location, match }) => {
              const roomID = get(match, 'params.id');
              // redirect if the roomID in auth doesn't match, or no credentials
              return roomID &&
                auth.roomID === roomID &&
                !isNil(auth.credentials) &&
                !isNil(auth.playerID) ? (
                <Game auth={auth} setAuth={setAuth} />
              ) : (
                <Redirect
                  to={{
                    pathname: '/',
                    state: { from: location, roomID },
                  }}
                />
              );
            }}
          />
          <Route path="/">
            <Lobby setAuth={setAuth} />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
