import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import axios from 'axios';

import "./App.css";

import Local from "./components/Local";
import Host from "./components/Host";
import Join from "./components/Join";

import Signup from './components/sign-up';
import LoginForm from './components/login-form'
import Navbar from './components/navbar'
import Home from './components/home'

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
      socket: false,
      loggedIn: false,
      username: null
    };
    this.getUser = this.getUser.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)
    this.updateUser = this.updateUser.bind(this)
  }

  componentDidMount() {
    this.getUser()
  }

  updateUser (userObject) {
    this.setState(userObject)
  }

  getUser() {
    axios.get('/user/').then(response => {
      console.log('Get user response: ')
      console.log(response.data)
      if (response.data.user) {
        console.log('Get User: There is a user saved in the server session: ')

        this.setState({
          loggedIn: true,
          username: response.data.user.username
        })
      } else {
        console.log('Get user: no user');
        this.setState({
          loggedIn: false,
          username: null
        })
      }
    })
  }

  render() {


    return (

      <SocketContext.Provider value={socket}>
     
        <Router>
          <div className="header">
          <Navbar updateUser={this.updateUser} loggedIn={this.state.loggedIn} />

              <hr />
              <div className="headerContent">
                  <div className="headerLogo">- synths - </div>
              
                  <Link to="/local">LOCAL</Link>&nbsp;&nbsp;
                  <Link to="/host">HOST</Link>&nbsp;&nbsp;
                  <Link to="/join">JOIN</Link>&nbsp;&nbsp;
              </div>
              <hr />
            
              
        {/* greet user if logged in: */}
        {this.state.loggedIn &&
          <p>Join the party, {this.state.username}!</p>
        }
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

              <Route
          exact path="/"
          component={Home} />
          
              <Route
          path="/login"
          render={() =>
            <LoginForm
              updateUser={this.updateUser}
            />}
        />
        <Route
          path="/signup"
          render={() =>
            <Signup/>}
        />


            </Switch>
          
        </Router>
  

      </SocketContext.Provider>

    );
  }
}

export default App;