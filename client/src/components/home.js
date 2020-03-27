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

                <p>Welcome, <span className="lead">{this.props.user}!</span></p><br></br>
                <p>News:</p>
                <div className="news-div">
                    <p>Pending - MIDI input - External input device for JOINERS. Use your MIDI keyboard for input. </p>
                    <p>Pending - Save Patch - Saving synth patches to your account (currently they don't actually persist, sorry!) </p>
                    <p>Pending - Bug fix - Webcam not turning off once entered HOST route, until page close/refresh.</p>
                    <p>26/3 - Security - The authentication shouldn't be doing annoying redirections any more, should you happen to refresh the page.</p>
                    <p>25/3 - Synth Hosting - WebRTC bug fix should be more robust. If you leave a synth hosted, expect it to run indefinately.</p>
                    <p>15/3 - New MIDI Map added: Moog Slim Phatty. Update: The map is wrong though, lol! I'll get back to working on these soon once I've got a few general page bugs out of the way. In the mean time, the MS2000 map is correct.</p>
                </div>
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
                    
                            <br></br><br></br>
                
                    <Link to="/signup" className="btn btn-link">
                        <span className="synthToolButton">SIGN UP</span>
                    </Link>

                    <Link to="/login" className="btn btn-link text-secondary">
                        <span className="synthToolButton">LOGIN</span>
                    </Link>

                            <br></br><br></br>

                    <p> You are not logged in. You will need to log in or sign up to use this app.</p>
                    <p> It's quick. You don't need to validate with email ;D</p>
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