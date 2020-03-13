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
        peerConnection: new RTCPeerConnection({ 'iceServers': [{ 'urls': 'stun:74.125.142.127:19302' }] }),
      };
    }
    
    componentDidMount() {

        //var  _iceServers = [{ url: 'stun:74.125.142.127:19302' }], // stun.l.google.com - Firefox does not support DNS names.
        // var servers = { 'iceServers': [{ 'urls': 'stun:74.125.142.127:19302' }] };
        // const connection = new RTCPeerConnection(servers);
        // this.setState({peerConnection: connection});

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

        const namesArr = [
            0,
            'Mod Wheel',
            2,
            3,
            'Pitch Bend',
            'Portamento',
            6,
            'Amp Level',
            8,
            9,
            'Pan Pot',
            11,
            'ModFX LFO Speed',
            'DelayFX Time',
            'OSC1 Control1',
            'OSC1 Control2',
            16,
            17,
            'OSC2 Semitone',
            'OSC2 Tune',
            'OSC1 Level',
            'OSC 2 Level',
            'Noise Level',
            'EG1 Attack',
            'EG1 Decay',
            'EG1 Sustain',
            'EG1 Release',
            'LFO1 Freq',
            'Patch 1',
            'Patch 2',
            'Patch 3',
            'Patch 4',
            32,
            33,
            34,
            35,
            36,
            37,
            38,
            39,
            40,
            41,
            42,
            43,
            44,
            45,
            46,
            47,
            48,
            49,
            50,
            51,
            52,
            53,
            54,
            55,
            56,
            57,
            58,
            59,
            60,
            61,
            62,
            63,
            64,
            65,
            66,
            67,
            68,
            69,
            'EG2 Sustain',
            'Filter Res',
            'EG2 Release',
            'EG2 Attack',
            'Filter Cutoff',
            'EG2 Decay',
            'LFO2 Freq',
            'OSC1 Wave',
            'OSC2 Wave',
            'EG1 Int',
            80,
            81,
            'OSC2 Mod',
            'Filter type',
            84,
            'Kbd Track',
            'EG2/Gate',
            'LFO1 Wave',
            'LFO2 Wave',
            'Seq On/Off',
            90,
            91,
            'Distortion',
            'ModFX Depth',
            'DelayFX Depth',
            'Timbre Select',
            96,
            97,
            98,
            99,
            100
        ]

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