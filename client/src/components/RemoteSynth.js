import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js'

import Slider from '@material-ui/core/Slider';
import Dropdown from 'rc-dropdown';
import Menu, { Item as MenuItem } from 'rc-menu';
//divider is available for drop down menu as { Divider }
import '../dropdown.css';

import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import '../pianoStyles.css';

const { RTCPeerConnection, RTCSessionDescription } = window;
var servers = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };

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
        viewColumns: 4,
        peerConnection: new RTCPeerConnection(servers),
        patches: ['Buzz', 'Voices', 'Tinky'],
        patchValues: [[102, 48, 119, 94, 31, 56, 46, 69, 108, 52, 96, 67, 88, 77, 83, 126, 85, 56, 55, 31, 69, 113, 44, 75, 48, 11, 2, 62, 42, 35, 106, 30, 68, 60, 27, 1, 12, 78, 63, 40, 41, 78, 28, 90, 1, 7, 19, 117, 108, 57, 19, 0, 16, 19, 86, 64, 23, 19, 52, 121, 113, 111, 1, 100, 22, 70, 51, 12, 7, 103, 3, 99, 62, 10, 48, 31, 65, 9, 100, 28, 111, 123, 93, 3, 72, 121, 67, 103, 25, 26, 87, 42, 5, 39, 33, 7],[80, 3, 0, 107, 89, 108, 13, 90, 20, 61, 54, 74, 40, 110, 48, 38, 36, 39, 106, 38, 70, 116, 62, 108, 92, 79, 46, 14, 102, 19, 52, 61, 119, 104, 79, 72, 115, 104, 29, 54, 88, 74, 21, 90, 74, 40, 44, 32, 36, 101, 117, 126, 93, 76, 26, 55, 86, 116, 127, 119, 77, 22, 28, 78, 2, 122, 96, 119, 86, 39, 95, 37, 66, 105, 8, 30, 45, 82, 116, 96, 91, 106, 55, 87, 3, 76, 115, 27, 3, 35, 67, 71, 51, 18, 64, 87],[55, 0, 110, 18, 3, 0, 83, 127, 121, 41, 60, 59, 0, 3, 0, 81, 18, 125, 59, 61, 127, 127, 0, 116, 60, 28, 61, 60, 61, 66, 66, 22, 115, 52, 114, 4, 90, 10, 45, 98, 62, 24, 111, 19, 113, 48, 38, 81, 59, 71, 8, 109, 8, 28, 79, 0, 84, 96, 51, 7, 85, 78, 101, 36, 23, 75, 38, 57, 15, 124, 90, 76, 61, 64, 45, 82, 0, 38, 54, 72, 81, 95, 74, 56, 80, 64, 88, 57, 15, 49, 60, 68, 48, 62, 65, 74]]
        ,
        currentPatch: 'None'
      };
    }
    
    componentDidMount() {

        // listner for socketIO data for statusArr
        this.props.socket.on('status', data => {
            this.setState({ statusArr: data, conToHost: true })
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
        this.props.socket.emit('removeUser', {room: this.state.currentRoom, msg: `removeUser`}); //needs removeUser function in server
        this.setState({ statusArr: [], conToHost: false });
        WebMidi.disable();
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

    sendStatusArr = (patchArr) => {
        this.props.socket.emit('sendConfig', {room: this.state.currentRoom, msg: patchArr});
        console.log('send status');
    }

    sendPatch = ({key}) => {
        console.log('send patch');
        console.log(key);
        let patchArr = [];
        key = parseInt(key);
        let patchName = this.state.patches[key];
        patchArr = this.state.patchValues[key];
        this.sendStatusArr(patchArr);
        this.setState({currentPatch: patchName});
    }

    savePatch = () => {
        console.log(this.state.statusArr);
        let newPatchValue = this.state.statusArr;
        let newPatchName = 'Patch '+ this.rndVal() + this.rndVal();
        let patchNameArr = this.state.patches;
        let patchValuesArr = this.state.patchValues;
        patchNameArr.push(newPatchName);
        patchValuesArr.push(newPatchValue);
        this.setState({patches: patchNameArr, patchValues: patchValuesArr, currentPatch: newPatchName});
    }
   

    sendRandom = () => {
        let newStatusArr = [];
        //120 for all CC params
        for (let i = 0 ; i < 96; i++) {
            let rndNum = this.rndVal();
            if (i === 7) rndNum = 127;
            if (i === 10) rndNum = 62;
            // set srray
            newStatusArr[i] = rndNum;
        }
        this.sendStatusArr(newStatusArr);
    }

    
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
        ];

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

        const patchMenu = (
            <Menu onSelect={this.sendPatch}>
                {this.state.patches.map((item, index) => (
                    <MenuItem key={index}>{item}</MenuItem>
                ))}
            </Menu>
        );

        const sliderStyle = {
            display: "inline-block",
            color: "gray"
            
        };

        const firstNote = MidiNumbers.fromNote('c2');
        const lastNote = MidiNumbers.fromNote('b3');
        const keyboardShortcuts = KeyboardShortcuts.create({
          firstNote: firstNote,
          lastNote: lastNote,
          keyboardConfig: KeyboardShortcuts.HOME_ROW,
        });
        
        const { statusArr } = this.state;
        return (

            <div className="container-fluid pb-3">
            <div className="">
                    {/* old bs row justify-content-md-center */}



                {(this.state.conToHost === false)
                ? <div>Not connected to host</div>
                : 
                <div>

                    {/* <div className="video-container">
                        
                    </div>  */}

                    <div className="synthToolbox">
                        
                    <video autoPlay className="remote-video" id="remote-video"></video>

                        <button className="btn btn-small synthToolButton" onClick={this.sendRandom}>Randomise Patch</button>
                        <button className="synthToolButton" onClick={this.savePatch}>Save Patch</button>
                        <Dropdown
                            trigger={['click']}
                            overlay={patchMenu}
                            animation="slide-up"
                        >
                            <button className="synthToolButton">User Patch:{this.state.currentPatch}</button>
                        </Dropdown>


                        <Dropdown
                            trigger={['click']}
                            overlay={columnMenu}
                            animation="slide-up"
                            onVisibleChange={this.onVisibleChange}
                        >
                            <button className="synthToolButton">Columns</button>
                        </Dropdown>
                        
                    </div>

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
                        ? <div className="status-div">Not connected to synth</div>
                        : statusArr.map((param, index) => (
                            <div key={index}>{typeof namesArr[index] === 'number' ? <div></div> : 
                            <div style={index === this.state.highlightedParam ? {color:'#f50057'} : {}}>
                                
                                {namesArr[index]} : {param}

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
                        
                        }

                        </div>


                        ))}


                    </div>
                        {/* was here */}

            </div>
            }


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