import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js';
import UserContext from '../context/user-context.js';

import Dropdown from 'rc-dropdown';
import Menu, { Item as MenuItem } from 'rc-menu';
import '../dropdown.css';

const { RTCPeerConnection, RTCSessionDescription } = window;


let peerConnections = {};


class HostSynth extends Component {
    constructor(props){
      super(props);
      this.state = {
        statusArr: [],
        highlightedParam: null,
        outputs: [],
        conToSynth: false,
        currentRoom: null,
        peerConnectionCounter: 0,
        isAlreadyCallingArr: [],
        selectedMidiOutId: null,
        selectedMidiOutName: 'None',
        selectedMidiMap: 'Select',
        roomTag: null
      };
    }

    componentDidMount() {

        //enable web midi OUTPUT only
        WebMidi.enable( (err) => {
            if (WebMidi.outputs[0]) this.setState({selectedMidiOutId: WebMidi.outputs[0].id, selectedMidiOutName: WebMidi.outputs[0].name});
            this.setState({outputs: WebMidi.outputs});
        }, true);   

        //fire up webcam and link to local-video element
        navigator.getUserMedia(
            { video: true, audio: true },
            stream => {
            const localVideo = document.getElementById("local-video");
              if (localVideo) {
                localVideo.srcObject = stream;
              }
            //   stream.getTracks().forEach(track => peerconnection1.addTrack(track, stream));
            // we don't add the streams here anymore, that happens in initiate-video socket listener
            },
            error => {
              console.warn(error.message);
            }
        );


        // clear out disconnected joiners
        this.props.socket.on('removeUser', (id) => {
            // from our already calling array
            let tempArr = this.state.isAlreadyCallingArr;
            for(let i=0; i < tempArr.length; i++){  
                if(tempArr[i].id === id){
                      
                      console.log('User DC, found id, now removing from arrray.');
                      tempArr.splice(i,1); 
                }
            }
            this.setState({isAlreadyCallingArr: tempArr});
            
            //delete peer connection
            if (peerConnections[id]) {
                peerConnections[id].close();
                delete peerConnections[id];
            }
    });

        // accept initiate call socket listener
        this.props.socket.on('initiate-video', (id) => {

            console.log('initiate video listener');

            var servers= {
                'iceServers': [
                  {
                    'urls': 'stun:stun.l.google.com:19302'
                  },
                  {
                    'urls': 'turn:numb.viagenie.ca',
                    'credential': 'thisismypass',
                    'username': 'jamespmcglone@gmail.com'
                }
                ]
              }

            let peerConnection = new RTCPeerConnection(servers);
            peerConnections[id] = peerConnection;
          
            const localVideo = document.getElementById("local-video");
            if (localVideo) {
            let stream = localVideo.srcObject;
            stream.getTracks().forEach(track => peerConnections[id].addTrack(track, stream));
            }

            console.log(id);
            this.callUser(id);

        });


        // answer made socket listener
        this.props.socket.on("answer-made", async data => {
            console.log('answer made');
            console.log(data.socket);
            await peerConnections[data.socket].setRemoteDescription(new RTCSessionDescription(data.answer));
            
            let arr = this.state.isAlreadyCallingArr;
            let alreadyCalling = false;

            for(let i=0; i < arr.length; i++){         
                if(arr[i].id === data.socket){
                    alreadyCalling = true;
                    console.log('found socket in already calling arr');
                }
            }

            if (alreadyCalling === false) {
                console.log('didnt find socket in already calling arr, now added');
                arr.push({id: data.socket, name: data.name});
                this.setState({isAlreadyCallingArr: arr});
                this.callUser(data.socket);
            }

        });


        //if window closes, send a close message
        window.onunload = window.onbeforeunload = () => {
            this.props.socket.close();
        };

    }

    componentWillUnmount() {
        // send removeHost message
        this.props.socket.emit('removeHost');

        WebMidi.disable();

        const localVideo = document.getElementById("local-video");
        this.stopWebcam(localVideo);
    }

    async callUser(socketId) {
        console.log('call user function');
        console.log(socketId);

        const offer = await peerConnections[socketId].createOffer();
        await peerConnections[socketId].setLocalDescription(new RTCSessionDescription(offer));
        
        this.props.socket.emit("call-user", {
            offer,
            to: socketId
        });

        // console.log(offer);
    };

    stopWebcam = (videoElem) => {
        const stream = videoElem.srcObject;
        const tracks = stream.getTracks();
      
        tracks.forEach(function(track) {
          track.stop();
        });
      
        videoElem.srcObject = null;
    }

    addHost = () => {

        let fish = this.state.roomTag;
        if (!fish) fish = 'Room ' + this.rndVal() + this.rndVal();
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
        this.props.socket.on('roomStatus', (data) => {
            
                this.updateRoomStatus(data);
            
        });




        //           navigator.getUserMedia(
        //             { video: true, audio: true },
        //             stream => {
        //               const localVideo = document.getElementById("local-video");
        //               if (localVideo) {
        //                 localVideo.srcObject = stream;
        //               }
        
        //               stream.getTracks().forEach(track => peerconnection1.addTrack(track, stream));
        //               //suss on that one
        //             },
        //             error => {
        //               console.warn(error.message);
        //             }
        //         );
        
        
        //         this.props.socket.on('initiate-video', (data) => {
        //             console.log(data);
        //             this.callUser(data);
        //         });
        
        
        //         this.props.socket.on("answer-made", async data => {
        //             console.log('answer made');
        //             await peerconnection1.setRemoteDescription(
        //                 new RTCSessionDescription(data.answer)
        //             );
                    
        //             if (!this.state.isAlreadyCalling) {
        //                 this.callUser(data.socket);
        //                 this.setState({isAlreadyCalling: true});
        //             }
        //         });
        
        //         peerconnection1.ontrack = function({ streams: [stream] }) {
        //             const remoteVideo = document.getElementById("remote-video");
        //             if (remoteVideo) {
        //             remoteVideo.srcObject = stream;
        //             }
        //        };
        //     }
            



    }
    
    updateRoomStatus = (data) => {
        this.setState({roomStatus: data});
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


    onMidiOutSelect = ({key}) => {
        let outputName = '';
        for (let i = 0; i < this.state.outputs.length; i++) {
            if (this.state.outputs[i].id === key) outputName = this.state.outputs[i].name;
        }
        this.setState({selectedMidiOutId: key, selectedMidiOutName: outputName});
    }
       
    onMidiMapSelect = ({key}) => {
        this.setState({selectedMidiMap: key});
    }

    handleChangeRoomTag = (event) => {
        this.setState({roomTag: event.target.value})
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

        const midiMapMenu = (
            <Menu onSelect={this.onMidiMapSelect}>
                    <MenuItem key="ms2000">Korg MS 2000</MenuItem>
                    <MenuItem key="sp">Moog Slim Phatty</MenuItem>
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
                                
                                <Dropdown
                                    trigger={['click']}
                                    overlay={midiMapMenu}
                                    animation="slide-up"
                                >
                                    <button className="synthToolButton">Midi Map: {this.state.selectedMidiMap}</button>
                                </Dropdown>

                                <div className="form-group">
                                    <div className="col-2 col-ml-auto">
                                        {/* <label className="form-label" htmlFor="username">Room name:</label> */}
                                    </div>
                                    <div className="col-3 col-mr-auto">
                                        <input className="form-input"
                                            type="text"
                                            id="roomTag"
                                            name="roomTag"
                                            placeholder="Room Name"
                                            value={this.state.username}
                                            onChange={this.handleChangeRoomTag}
                                        />
                                    </div>
                                
                                    <div className="col-3 col-mr-auto">
                                        {this.state.selectedMidiOutId === null 
                                        ? <div><br></br><button className="synthToolButtonDisabled">Connect to Synth</button>
                                        <br></br><br></br>No synth or midi interface detected. You need one to be a host!</div> 
                                        : <div><br></br><button className="synthToolButton" onClick={this.connectToSynth}>Connect to Synth</button></div>}
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                    

                    <div style={{ columnCount:5}}>
                    {statusArr.length <= 0
                    ? <div className="status-div"></div>
                    : statusArr.map((param, index) => (
                        <div key={index} style={index === this.state.highlightedParam ? {color:'#f50057'} : {}}>
                            {index} : {param}
                        </div>
                    ))}

                </div>

                {/* <div className="video-container">
                    
                </div> */}
                {this.state.conToSynth &&
                <div><br></br>
                    Connected Users:<br></br>
                    {this.state.isAlreadyCallingArr.length <= 0
                    ? <div className="status-div">No users connected.</div>
                    :
                    this.state.isAlreadyCallingArr.map((user, index) => (
                        <div key={index}>
                            {user.name}<br></br>
                        </div>
                    ))}
                </div>}
                    
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