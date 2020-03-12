import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js'

import Slider from '@material-ui/core/Slider';
import Dropdown from 'rc-dropdown';
import Menu, { Item as MenuItem, Divider } from 'rc-menu';
import 'rc-dropdown/assets/index.css';

import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';

const { RTCPeerConnection, RTCSessionDescription } = window;

class RemoteSynth extends Component {
    constructor(props){
      super(props);
      this.state = {
        statusArr: [],
        highlightedParam: null,
        inputs: [],
        outputs: [],
        conToHost: false,
        value: 50,
        currentRoom: this.props.currentRoom,
        viewColumns: 1,
        peerConnection: new RTCPeerConnection()
      };
    }
    
    componentDidMount() {

        // listner for socketIO data for statusArr
        this.props.socket.on('status', data => {
            console.log('Recievy the status');
            console.log('Incoming statusArr:', data);
            this.setState({ statusArr: data })
        });

        // will use for input midi device ie. input keyboard
        // WebMidi.enable( (err) => {
        //     console.log(WebMidi.inputs);
        //     console.log(WebMidi.outputs);
        // }, true);   

        this.requestStatusArr();

        // listener for RTC call
            this.props.socket.on("call-made", async data => {
                await this.state.peerConnection.setRemoteDescription(
                new RTCSessionDescription(data.offer)
                );
            const answer = await this.state.peerConnection.createAnswer();
            await this.state.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
            
                this.props.socket.emit("make-answer", {
                    answer,
                    to: data.socket
                });
           });

           this.state.peerConnection.ontrack = function({ streams: [stream] }) {
            const remoteVideo = document.getElementById("remote-video");
            if (remoteVideo) {
            remoteVideo.srcObject = stream;
            }
       };

        console.log('sending initiate video to room');
           console.log(this.state.currentRoom);
        this.props.socket.emit('initiate-video', {room: this.state.currentRoom, msg: this.props.socket.id});

    }
    
    componentWillUnmount() {
        this.props.socket.emit('removeUser'); //needs removeUser function in server
    }

    requestStatusArr = () => {
        this.props.socket.emit('msg', {room: this.state.currentRoom, msg: `RequestConfig`});
      }


    SendCC = (cc, value) => {
        let output = WebMidi.getOutputByName("UM-1");
        output.sendControlChange(cc, value);
    }

    rndVal = () => {
        let rndNum = Math.floor(Math.random() * 128);
        return rndNum;
    }

    requestRandomPatch = () => {
        this.props.socket.emit('Func', {room: this.state.currentRoom, msg: `Random`});
    }


    // adjust all notes
    // recieveStatus = () => {
        
    //     var input = WebMidi.getInputByName("UM-1");
    //     input.addListener('controlchange', "all", (e) => {
    //     //   console.log("Received 'controlchange' message.", e);
    //     //   console.log(e.controller.number);
    //     //   console.log(e.value);
            
    //     this.updateOneParam(e.controller.number, e.value);
    //     this.handleSliderChange(e.controller.number, e.value)
            
    //     });
    //     this.setState({conToSynth: true});
    //     this.addHost();
    // }

    updateOneParam(i, v){
        
        let rv = Math.round(v);
        this.props.socket.emit('CC', {room: this.state.currentRoom, msg: { param: i, value: rv}});
        const newArr = this.state.statusArr;
        // this.handleSliderChange(i, rv)
        newArr[i] = rv;
        this.setState({statusArr: newArr, highlightedParam: i});
    };

    playNoteToSocket = (note) => {
        this.props.socket.emit('Note', {room: this.state.currentRoom, msg: { note: note, type: 'on'}});
    }
    
    stopNoteToSocket = (note) => {
        this.props.socket.emit('Note', {room: this.state.currentRoom, msg: { note: note, type: 'off'}});
    }

    handleSliderChange = (event, newValue) => {
        
        if (event.target.classList.contains("MuiSlider-thumb")) {
            if (event.target.parentNode.dataset.slider) {
                this.updateOneParam(parseInt(event.target.parentNode.dataset.slider), newValue);
            }
        } else {
            if (event.target.dataset.slider) {
                this.updateOneParam(parseInt(event.target.dataset.slider), newValue);
            }
        }
    };

    onColumnSelect = ({key}) => {
        this.setState({viewColumns: key});

        this.state.peerConnection.ontrack = function({ streams: [stream] }) {
            const remoteVideo = document.getElementById("remote-video");
            if (remoteVideo) {
            remoteVideo.srcObject = stream;
            }
       };

      }

    render() {

        const columnMenu = (
            <Menu onSelect={this.onColumnSelect}>
              <MenuItem key="1">1</MenuItem>
              <MenuItem key="2">2</MenuItem>
              <MenuItem key="3">3</MenuItem>
              <MenuItem key="4">4</MenuItem>
              <MenuItem key="5">5</MenuItem>
              <MenuItem key="6">6</MenuItem>
            </Menu>
        );

        const sliderStyle = {
            display: "inline-block",
            color: "white"
        };

        const firstNote = MidiNumbers.fromNote('c2');
        const lastNote = MidiNumbers.fromNote('f4');
        const keyboardShortcuts = KeyboardShortcuts.create({
          firstNote: firstNote,
          lastNote: lastNote,
          keyboardConfig: KeyboardShortcuts.HOME_ROW,
        });
        
        const { statusArr } = this.state;
        return (
            <div className="container-fluid pb-3">
                <div className="row justify-content-md-center">
                
                    <button className="synthToolButton" onClick={this.requestRandomPatch}>Request Random Patch</button>

                    <Dropdown
                        trigger={['click']}
                        overlay={columnMenu}
                        animation="slide-up"
                        onVisibleChange={this.onVisibleChange}
                    >
                        <button className="synthToolButton" style={{ float: 'right' }}>Columns</button>
                    </Dropdown>

                    <div className="keys-container">
                        <Piano
                            noteRange={{ first: firstNote, last: lastNote }}
                            playNote={(midiNumber) => {
                                this.playNoteToSocket(midiNumber)
                            }}
                            stopNote={(midiNumber) => {
                                this.stopNoteToSocket(midiNumber)
                            }}
                            // width={1000}
                            keyboardShortcuts={keyboardShortcuts}
                        />
                    </div>

                    <div style={{ columnCount: this.state.viewColumns}}>
                
                    {statusArr.length <= 0
                    ? <div className="status-div">Loading params...</div>
                    : statusArr.map((param, index) => (
                        <div key={index} style={index === this.state.highlightedParam ? {color:'red'} : {color:'white'}}>
                            
                            {index} : {param}
                
                            <Slider
                                    value={this.state.statusArr[index]}
                                    onChange={this.handleSliderChange}
                                    aria-labelledby="input-slider"
                                    data-slider={index} 
                                    min={0} 
                                    max={127} 
                                    color={'secondary'} 
                                    style={sliderStyle}
                            />

                        </div>

                    ))}
                </div>

                <div className="video-container">
                    <video autoPlay className="remote-video" id="remote-video"></video>
                    {/* <video autoPlay muted className="local-video" id="local-video"></video> */}
                </div>

            </div>
          </div>
        );
    }
}
  
const RemoteSynthWithSocket = props => (
    <SocketContext.Consumer>
    {socket => <RemoteSynth {...props} socket={socket} />}
    </SocketContext.Consumer>
  )
    
  export default RemoteSynthWithSocket;