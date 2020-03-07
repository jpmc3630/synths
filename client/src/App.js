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

import io from "socket.io-client";



class App extends Component {

  constructor() {
    super();
    this.state = {
      response: false,
      endpoint: "http://127.0.0.1:4001",
      socket: false
    };
  }

  componentDidMount() {
    // const { endpoint } = this.state;
    // const socket = socketIOClient(endpoint);
    // socket.on("FromAPI", data => this.setState({ response: data }));

    const socketVar = io();
    this.setState({socket: socketVar})
    
    socketVar.on("message", data => this.setState({ response: data }));
    
  }


  sendMSG = () => {
    this.state.socket.emit("message", "hello");
  }


  render() {

    const { response } = this.state;

    return (

      <Router>
      <div>
      {response
              ? <p>
                The message is: {response}
              </p>
              : <p>No message received yet...</p>}

        <button onClick={this.sendMSG}>test</button>

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