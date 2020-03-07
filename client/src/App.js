import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import "./App.css";

import Host from "./components/Host";
import Join from "./components/Join";

import socketIOClient from "socket.io-client";


class App extends Component {

  constructor() {
    super();
    this.state = {
      response: false,
      endpoint: "http://127.0.0.1:3001"
    };
  }

  componentDidMount() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on("message", data => this.setState({ response: data }));
  }

  render() {
    const { response } = this.state;
    return (

      <Router>
      <div>

      {response
              ? <p>
                The temperature in Florence is: {response} °F
              </p>
              : <p>Loading...</p>}

        <ul>
          <li>
            <Link to="/">Host Synth</Link>
          </li>
          <li>
            <Link to="/join">Join Synth</Link>
          </li>
        </ul>

        <hr />



        <Switch>
          <Route exact path="/">
            <Host />
          </Route>
          <Route path="/join">
            <Join />
          </Route>
        </Switch>
      </div>
    </Router>

    );
  }
}

export default App;