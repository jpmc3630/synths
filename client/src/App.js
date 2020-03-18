import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import "./App.css";

import Local from "./components/Local";
import Host from "./components/Host";
import Join from "./components/Join";

import SocketContext from './context/socket-context';
import io from "socket.io-client";


let socket;
if (process.env.NODE_ENV === 'development') {
  socket = io(`http://localhost:3001/`);
} else {
  socket = io();
}


// `http://localhost:3001/`

class App extends Component {

  constructor() {
    super();
    this.state = {
      response: false,
      socket: false
    };
  }


  render() {


    return (

      <SocketContext.Provider value={socket}>
     
        <Router>
          <div className="header">
            

              <hr />
              <div className="headerContent">
                  <div className="headerLogo">- synths - </div>
              
                  <Link to="/local">LOCAL</Link>&nbsp;&nbsp;
                  <Link to="/host">HOST</Link>&nbsp;&nbsp;
                  <Link to="/join">JOIN</Link>&nbsp;&nbsp;
              </div>
              <hr />
            
          </div>
          
            <Switch>
              <Route exact path="/local">
                <Local />
              </Route>
              <Route exact path="/host">
                <Host />
              </Route>
              <Route path="/join">
                <Join />
              </Route>
            </Switch>
          
        </Router>
  

      </SocketContext.Provider>

    );
  }
}

export default App;