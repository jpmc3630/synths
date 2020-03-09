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
    // console.log(this.props.socket); 
    // this.props.socket.on("hosts", data => this.setState({ hostsArr: data }));

        console.log(this.props.socket.id); // an alphanumeric id...

        this.props.socket.emit('getHosts', 'kanichiwa');
        console.log('emitting getHosts message');

        this.props.socket.on('getHosts', data => {
            console.log('Incoming message:', data);
            this.setState({ hostsArr: data })
        });

    }


    connectToRoom = (roomName) => {
      console.log('Connecting to... ' + roomName);
      this.props.socket.emit('joinRoom', roomName);
      this.setState({currentRoom: roomName})

      
    }





    render() {
  
      if(this.state.currentRoom == null) {
        return (
          
              <div>
                Join page


                {this.state.hostsArr.length <= 0
                    ? <p>No synth hosts available right now...</p>
                    : this.state.hostsArr.map((host, index) => ( <p key={index+host.hostSocket}>
                      Host Available: {index} : {host.hostSocket}: {host.room} : {host.userCount} : <button onClick={() => this.connectToRoom(host.room)}>Join</button>
                    </p> ))}
                    
                    
                    

                    

              </div>
              );

          } else {
        return (
            <div>
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