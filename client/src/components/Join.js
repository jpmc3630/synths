import React, { Component } from "react";
import SocketContext from '../context/socket-context.js'
import RemoteSynth from "./RemoteSynth"



class Join extends Component {
    constructor(props){
      super(props);
      this.state = {
        data: [],
        hostsArr: [],
        currentRoom: null
        
      };
   }
  
   componentDidMount() {

        this.props.socket.emit('getHosts', 'kanichiwa');

        this.props.socket.on('getHosts', data => {
            this.setState({ hostsArr: data })
        });
    }

    connectToRoom = (roomName) => {
      this.props.socket.emit('joinRoom', roomName);
      this.setState({currentRoom: roomName})     
    }

    render() {
  
      if(this.state.currentRoom === null) {
        return (
          
              <div className="content">

                {this.state.hostsArr.length <= 0
                    ? <p>No synth hosts available right now...</p>
                    : this.state.hostsArr.map((host, index) => ( <p key={index+host.hostSocket}>
                      Host Available: <br></br>
                      {host.room} - Users: {host.userCount} : <button className="synthToolButton" onClick={() => this.connectToRoom(host.room)}>Join</button>
                    </p> ))
                }   

              </div>
              );

          } else {
        return (
            <div className="content">
              <div></div>
              <RemoteSynth currentRoom={this.state.currentRoom} />
            </div>
        )

    }
  }
}
  
  const JoinWithSocket = props => (
    <SocketContext.Consumer>
    {socket => <Join {...props} socket={socket} />}
    </SocketContext.Consumer>
  )
    
  export default JoinWithSocket;