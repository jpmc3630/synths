import React, { Component } from 'react';
import {BrowserRouter as Router, Switch, Route, Link, Redirect} from "react-router-dom";

import "./App.css";
import Local from "./components/Local";
import Host from "./components/Host";
import Join from "./components/Join";
import Signup from './components/sign-up';
import LoginForm from './components/login-form';
import Home from './components/home';

import UserContext from './context/user-context';
import SocketContext from './context/socket-context';

import io from "socket.io-client";
import axios from 'axios';

let socket;
if (process.env.NODE_ENV === 'development') {
  socket = io(`http://localhost:3001/`);
} else {
  socket = io();
}


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
    this.logout = this.logout.bind(this)
  }

  componentDidMount() {
    this.getUser()
  }

  updateUser (userObject) {
    this.setState(userObject)
  }

  getUser() {
    axios.get('/user/').then(response => {
      if (response.data.user) {
        this.setState({
          loggedIn: true,
          username: response.data.user.username
        })
      } else {
        this.setState({
          loggedIn: false,
          username: null
        })
      }
    })
  }

  logout(event) {
    event.preventDefault()
    axios.post('/user/logout').then(response => {
      console.log(response.data)
      if (response.status === 200) {
        this.updateUser({
          loggedIn: false,
          username: null
        })
      }
    }).catch(error => {
        console.log('Logout error')
    })
  }


  
  render() {

    const ProtectedRoute = ({ component: Comp, loggedIn, path, ...rest }) => {
      return (
        <Route
          path={path}
          {...rest}
          render={props => {
            return loggedIn ? <Comp {...props} /> : <div className="content">You are not logged in.<br></br>
                <Link to="/login" className="btn btn-link text-secondary">
            <span className="text-secondary">LOGIN</span>
          </Link></div>;
          }}
        />
      );
    };

    return (
        <UserContext.Provider value={this.state.username}>
              <SocketContext.Provider value={socket}>
            
                <Router>
                  <div className="">
                  
                  
                      <div className="headerContent">
                          <div className="headerLogo">- synths - </div>
                        {this.state.loggedIn ? 
                        <div>

                            <div className="floatRightMenu">
                              <Link to="/" className="btn btn-link text-secondary">
                                    <span className="text-secondary">HOME</span>
                                </Link>
                                <Link to="#" className="btn btn-link text-secondary" onClick={this.logout}>
                                    <span className="text-secondary">LOG OUT</span>
                                </Link>
                                <span className="userName">{this.state.username}</span>
                            </div>

                            <div className="floatLefttMenu">
                                <Link to="/local" className="btn btn-link text-secondary">
                                  <span className="text-secondary">LOCAL MODE</span>
                                </Link>
                                <Link to="/host" className="btn btn-link text-secondary">
                                  <span className="text-secondary">HOST</span>
                                </Link>


                                <Link to="/join" className="btn btn-link text-secondary">
                                  <span className="text-secondary">JOIN</span>
                                </Link>




                            </div>

                          </div>
                          :
                          <div>
                            <div className="floatRightMenu">
                                <Link to="/" className="btn btn-link text-secondary">
                                    <span className="text-secondary">HOME</span>
                                </Link>

                                <Link to="/signup" className="btn btn-link">
                                  <span className="text-secondary">SIGN UP</span>
                                </Link>

                                <Link to="/login" className="btn btn-link text-secondary">
                                  <span className="text-secondary">LOGIN</span>
                                </Link>

                            </div>

                          </div>
                        }
                      </div>
                      <hr className="my-2"/>
                    
                      
                
                  </div>

              
                  
                    <Switch>

                      <ProtectedRoute path="/local" loggedIn={this.state.loggedIn} component={Local} />
                      <ProtectedRoute path="/host" loggedIn={this.state.loggedIn} component={Host} />
                      <ProtectedRoute path="/join" loggedIn={this.state.loggedIn} component={Join} />

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
        </UserContext.Provider>      
    );
  }
}

export default App;