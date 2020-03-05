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

class App extends Component {
  render() {
    return (

      <Router>
      <div>
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