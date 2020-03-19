import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
  } from "react-router-dom";
import SocketContext from '../context/socket-context.js';
import UserContext from '../context/user-context.js';

class Home extends Component {
    constructor() {
        super()
    }


    render() {
        const imageStyle = {
            width: 400
        }
        return (


            <div className="content">

            {this.props.user ? 
                <div className="text-center nudgeLeft">

                <p>You are logged in as <span className="lead">{this.props.user}!</span></p><br></br>
                <p>News:<br />17/3 - New Midi Map added: Arturia Minibrute
                <br />15/3 - New Midi Map added: Moog Slim Phatty
                </p>
                <br></br>
                            <Link to="/local" className="btn btn-link text-secondary">
                                <span className="synthToolButton">LOCAL MODE</span>
                            </Link>
                            <Link to="/host" className="btn btn-link text-secondary">
                                <span className="synthToolButton">HOST</span>
                            </Link>
                            <Link to="/join" className="btn btn-link text-secondary">
                                <span className="synthToolButton">JOIN</span>
                            </Link>

                </div>
                :<div className="text-center nudgeLeft">
                <br></br>
                    <p className="lead"> Welcome to Synths</p><br></br>
                    <p> This app is for sharing hardware synthesisers online!</p>
                    <p> You can share synths, or play synths that others are sharing!</p>
                    <p> You are not logged in. You will need to log in or sign up to use this app.</p>
                            <br></br><br></br>
                
                    <Link to="/signup" className="btn btn-link">
                        <span className="synthToolButton">SIGN UP</span>
                    </Link>

                    <Link to="/login" className="btn btn-link text-secondary">
                        <span className="synthToolButton">LOGIN</span>
                    </Link>

                </div>
                
            }
           
            </div>



        )

    }
}

// export default Home;


const HomeWithContext = props => (
    <UserContext.Consumer>
    {user => (
        <SocketContext.Consumer>
        {socket => <Home {...props} socket={socket} user={user} />}
        </SocketContext.Consumer>
    )}
    </UserContext.Consumer>    
)

export default HomeWithContext;