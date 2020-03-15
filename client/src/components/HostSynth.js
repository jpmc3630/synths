import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js'
const { RTCPeerConnection, RTCSessionDescription } = window;
var servers = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };


class HostSynth extends Component {
    constructor(props){
      super(props);
      this.state = {
        statusArr: [],
        highlightedParam: null,
        inputs: [],
        outputs: [],
        conToSynth: false,
        currentRoom: null,
        peerConnection: new RTCPeerConnection(servers),
        isAlreadyCalling: false
      };
    }

    componentDidMount() {
        WebMidi.enable( (err) => {
            console.log(WebMidi.inputs);
            console.log(WebMidi.outputs); 
        }, true);

        // let servers = { 'iceServers': [{ 'urls': 'stun:74.125.142.127:19302' }] };
        // // var  _iceServers = [{ url: 'stun:74.125.142.127:19302' }], // stun.l.google.com - Firefox does not support DNS names.

        // const connection = new RTCPeerConnection(servers);
        // this.setState({peerConnection: connection});

        navigator.getUserMedia(
            { video: true, audio: true },
            stream => {
              const localVideo = document.getElementById("local-video");
              if (localVideo) {
                localVideo.srcObject = stream;
              }

              stream.getTracks().forEach(track => this.state.peerConnection.addTrack(track, stream));
              //suss on that one
            },
            error => {
              console.warn(error.message);
            }
        );


        this.props.socket.on('initiate-video', (data) => {
            console.log(data);
            this.callUser(data);
        });


        this.props.socket.on("answer-made", async data => {
            console.log('answer made');
            await this.state.peerConnection.setRemoteDescription(
                new RTCSessionDescription(data.answer)
            );
            
            if (!this.state.isAlreadyCalling) {
                this.callUser(data.socket);
                this.setState({isAlreadyCalling: true});
            }
        });

        this.state.peerConnection.ontrack = function({ streams: [stream] }) {
            const remoteVideo = document.getElementById("remote-video");
            if (remoteVideo) {
            remoteVideo.srcObject = stream;
            }
       };

    }
    
    componentWillUnmount() {
        this.props.socket.emit('removeHost');
    }

    addHost = () => {

        let fish = 'room' + this.rndVal() + this.rndVal();
        this.setState({currentRoom: fish});
        this.props.socket.emit('room', fish);
        console.log('emitting to room' + fish);

        this.props.socket.on('msg', (data) => {
            console.log(data);
            if (data === 'RequestConfig') {
                this.sendStatusArr();
            }
        });

        this.props.socket.on('Note', (data) => {
            console.log('recieved Note message:');
            console.log(data);
            if (data.type === 'on') {
                this.playNoteToSynth(data.note);
            } else {
                this.stopNoteToSynth(data.note);
            };
          });

        this.props.socket.on('CC', (data) => {
            console.log('recieved CC message:');
            console.log(data);
            this.updateOneParam(data.param, data.value);
          });

        this.props.socket.on('Func', (data) => {
            if (data === 'Random') {
                this.randomPatch();
            }
        });

    }
    
    playNoteToSynth = (note) => {
        let output = WebMidi.getOutputByName("UM-1");
        output.playNote(note);
    }
    
    stopNoteToSynth = (note) => {
        let output = WebMidi.getOutputByName("UM-1");
        output.stopNote(note);
    }

    sendStatusArr = () => {
        this.props.socket.emit('status', {room: this.state.currentRoom, msg: this.state.statusArr});
    }

    CC = (cc, value) => {
        let output = WebMidi.getOutputByName("UM-1");
        output.sendControlChange(cc, value);
    }

    rndVal = () => {
        let rndNum = Math.floor(Math.random() * 128);
        return rndNum;
    }

    randomPatch = () => {
        let newStatusArr = [];
        //120 for all CC params
        for (let i = 0 ; i < 120; i++) {
            let rndNum = this.rndVal();
            // set the synth
            this.CC(i, rndNum);
            // set srray
            newStatusArr[i] = rndNum;
        }
        this.setState({statusArr: newStatusArr});
        this.sendStatusArr();
    }

    // adjust all notes
    connectToSynth = () => {
        var input = WebMidi.getInputByName("UM-1");
        this.randomPatch();
        this.setState({conToSynth: true});
        this.addHost();
    }

    updateOneParam(i, v){

        let rv = Math.round(v);

        if (rv != this.state.statusArr[i]) {
            console.log(rv)
            const newArr = this.state.statusArr;
            
            newArr[i] = rv;
            this.setState({statusArr: newArr, highlightedParam: i});

            this.CC(i, rv);
        }
    };


        async callUser(socketId) {
        const offer = await this.state.peerConnection.createOffer();
        await this.state.peerConnection.setLocalDescription(new RTCSessionDescription(offer));
        
        this.props.socket.emit("call-user", {
            offer,
            to: socketId
        });

        console.log(offer);


       }

       

    render() {

        const { statusArr } = this.state;


        return (
            <div className="container-fluid pb-3">
                <div className="row justify-content-md-center">
                
                    {this.state.conToSynth 
                    ? <div>Connected to Synth</div>
                    : <button className="synthToolButton" onClick={this.connectToSynth}>Connect to Synth</button>
                    }

                    <div style={{ columnCount:4}}>
                
                    {statusArr.length <= 0
                    ? <div className="status-div">Loading params</div>
                    : statusArr.map((param, index) => (
                        <div key={index} style={index === this.state.highlightedParam ? {color:'red'} : {}}>
                        {index} : {param}

                    </div>

                    ))}
                </div>

                <div className="video-container">
                    {/* <video autoPlay className="remote-video" id="remote-video"></video> */}
                    <video autoPlay muted className="local-video" id="local-video"></video>
                </div>

            </div>
          </div>
        );
    }
}
  
const HostSynthWithSocket = props => (
    <SocketContext.Consumer>
    {socket => <HostSynth {...props} socket={socket} />}
    </SocketContext.Consumer>
  )
    
  export default HostSynthWithSocket;