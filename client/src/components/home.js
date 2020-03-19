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
                <div className="">

                <p>You are logged in as <span className="lead">{this.props.user}!</span></p>
                <p>Latest News:<br />17/3 - New Midi Map added: Arturia Minibrute</p>

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
                :<div>
                <p> You are not logged in</p>
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