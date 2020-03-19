import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js';
import UserContext from '../context/user-context.js';

import Dropdown from 'rc-dropdown';
import Menu, { Item as MenuItem } from 'rc-menu';

const { RTCPeerConnection, RTCSessionDescription } = window;
var servers = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };


class HostSynth extends Component {
    constructor(props){
      super(props);
      this.state = {
        statusArr: [],
        highlightedParam: null,
        outputs: [],
        conToSynth: false,
        currentRoom: null,
        peerConnection: new RTCPeerConnection(servers),
        isAlreadyCalling: false,
        selectedMidiOutId: null,
        selectedMidiOutName: 'None'
      };
    }

    componentDidMount() {
        
        WebMidi.enable( (err) => {
            if (WebMidi.outputs[0]) this.setState({selectedMidiOutId: WebMidi.outputs[0].id, selectedMidiOutName: WebMidi.outputs[0].name});
            this.setState({outputs: WebMidi.outputs});
        }, true);   


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
        WebMidi.disable();
    }

    addHost = () => {

        let fish = 'room' + this.rndVal() + this.rndVal();
        this.setState({currentRoom: fish});
        this.props.socket.emit('room', fish);
        console.log('emitting to room' + fish);

        this.props.socket.on('msg', (data) => {
            if (data === 'RequestConfig') {
                this.sendStatusArr();
            }
        });

        this.props.socket.on('sendConfig', (data) => {
                this.loadPatch(data);
        });

        this.props.socket.on('Note', (data) => {
            if (data.type === 'on') {
                this.playNoteToSynth(data.note);
            } else {
                this.stopNoteToSynth(data.note);
            };
          });

        this.props.socket.on('CC', (data) => {
            this.updateOneParam(data.param, data.value);
          });

        this.props.socket.on('Func', (data) => {
            if (data === 'Random') {
                this.randomPatch();
            }
        });

    }
    
    loadPatch = (patchArr) => {
        if (Array.isArray(patchArr)) {
            console.log(patchArr);
            this.setState({statusArr: patchArr});
            
            for (let i = 0; i < patchArr.length; i++) {
                this.CC(i, patchArr[i]);
            }
            this.sendStatusArr();
        }
    }

    playNoteToSynth = (note) => {
        let output = WebMidi.getOutputById(this.state.selectedMidiOutId);
        output.playNote(note);
    }
    
    stopNoteToSynth = (note) => {
        let output = WebMidi.getOutputById(this.state.selectedMidiOutId);
        output.stopNote(note);
    }

    sendStatusArr = () => {
        this.props.socket.emit('status', {room: this.state.currentRoom, msg: this.state.statusArr});
    }

    CC = (cc, value) => {
        let output = WebMidi.getOutputById(this.state.selectedMidiOutId);
        output.sendControlChange(cc, value);
    }

    rndVal = () => {
        let rndNum = Math.floor(Math.random() * 128);
        return rndNum;
    }

    randomPatch = () => {
        let newStatusArr = [];
        //120 for all CC params
        for (let i = 0 ; i < 96; i++) {
            let rndNum = this.rndVal();
            if (i === 7) rndNum = 127;
            if (i === 10) rndNum = 62;
            // set the synth
            this.CC(i, rndNum);
            // set srray
            newStatusArr[i] = rndNum;
        }
        this.setState({statusArr: newStatusArr});
        this.sendStatusArr();
    }

    connectToSynth = () => {
        this.randomPatch();
        this.setState({conToSynth: true});
        this.addHost();
    }

    updateOneParam(i, v){

        let rv = Math.round(v);

        if (rv !== this.state.statusArr[i]) {
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
    };

    onMidiOutSelect = ({key}) => {
        let outputName = '';
        for (let i = 0; i < this.state.outputs.length; i++) {
            if (this.state.outputs[i].id === key) outputName = this.state.outputs[i].name;
        }
        this.setState({selectedMidiOutId: key, selectedMidiOutName: outputName});
    }
       

    render() {

        const { statusArr } = this.state;

        const midiOutMenu = (
            <Menu onSelect={this.onMidiOutSelect}>
                {this.state.outputs.map((item, index) => (
                    <MenuItem key={this.state.outputs[index].id}>{this.state.outputs[index].name}</MenuItem>
                ))}
            </Menu>
        );

        return (
            <div className="container-fluid pb-3">
                <div className="">

                    
                    
                    <div className="synthToolboxHost">
                    <video autoPlay muted className="local-video" id="local-video"></video>
                        {this.state.conToSynth === false &&
                            <div>
                                <Dropdown
                                    trigger={['click']}
                                    overlay={midiOutMenu}
                                    animation="slide-up"
                                >
                                    <button className="synthToolButton">Midi Out: {this.state.selectedMidiOutName}</button>
                                </Dropdown>
                                
                                <button className="synthToolButton" onClick={this.connectToSynth}>Connect to Synth</button>
                            </div>
                        }
                    </div>
                    

                    <div style={{ columnCount:5}}>
                    
                    {statusArr.length <= 0
                    ? <div className="status-div"></div>
                    : statusArr.map((param, index) => (
                        <div key={index} style={index === this.state.highlightedParam ? {color:'red'} : {}}>
                        {index} : {param}

                    </div>

                    ))}
                </div>

                <div className="video-container">
                    
                </div>

            </div>
          </div>
        );
    }
}
  
const HostSynthWithSocket = props => (
        <UserContext.Consumer>
        {user => (
            <SocketContext.Consumer>
            {socket => <HostSynth {...props} socket={socket} user={user} />}
            </SocketContext.Consumer>
        )}
        </UserContext.Consumer>    
  )
    
export default HostSynthWithSocket;