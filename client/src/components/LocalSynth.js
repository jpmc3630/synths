import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js'
// import Keys from "./Keys"


import Slider from '@material-ui/core/Slider';
import Dropdown from 'rc-dropdown';
import Menu, { Item as MenuItem, Divider } from 'rc-menu';
import 'rc-dropdown/assets/index.css';

import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';


class LocalSynth extends Component {
    constructor(props){
      super(props);
      this.state = {
        statusArr: [],
        highlightedParam: null,
        inputs: [],
        outputs: [],
        conToSynth: false,
        currentRoom: null,
        viewColumns: 1
      };
    }

    componentDidMount() {
        WebMidi.enable( (err) => {
            console.log(WebMidi.inputs);
            console.log(WebMidi.outputs); 
        }, true);   
    }
    
    componentWillUnmount() {
        this.props.socket.emit('removeHost');
    }


    sendStatusArr = () => {
        console.log('sendy the status:');
        console.log({room: this.state.currentRoom, msg: this.state.StatusArr});
        this.props.socket.emit('status', {room: this.state.currentRoom, msg: this.state.statusArr});
    }

    CC = (cc, value) => {
        let output = WebMidi.getOutputByName("UM-1");
        output.sendControlChange(cc, value);
    }

    playNoteToSynth = (note) => {
        let output = WebMidi.getOutputByName("UM-1");
        output.playNote(note);
    }
    
    stopNoteToSynth = (note) => {
        let output = WebMidi.getOutputByName("UM-1");
        output.stopNote(note);
    }

    rndVal = () => {
        let rndNum = Math.floor(Math.random() * 128);
        return rndNum;
    }

    randomPatch = () => {
        let newStatusArr = [];
        //120 for all CC params
        for (let i = 0 ; i < 75; i++) {
            let rndNum = this.rndVal();
            
            // set the synth
            this.CC(i, rndNum);

            // set srray
            newStatusArr[i] = rndNum;
            
        }
        this.setState({statusArr: newStatusArr});
    }

    // adjust all notes
    recieveCC = () => {
        var input = WebMidi.getInputByName("UM-1");

        // receive CC is enabled for now
        input.addListener('controlchange', "all", (e) => {
          console.log("Received 'controlchange' message:");
          console.log(e.controller.number);
          console.log(e.value);
            
        this.updateOneParam(e.controller.number, e.value);
       
        });
    }

    updateOneParam(i, v){

        let rv = Math.round(v);

        if (rv != this.state.statusArr[i]) {
            console.log(rv)
            const newArr = this.state.statusArr;
            
            // this.handleSliderChange(i, rv)
            newArr[i] = rv;
            this.setState({statusArr: newArr, highlightedParam: i});

            this.CC(i, rv);
        }
    };

    
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

    loadPatch = () => {
        let patchArr = [30,30,31,102,27,108,83,127,48,35,56,105,23,20,127,6,0,30,64,64,87,44,0,6,106,110,28,3,93,94,6,2,32,50,105,100,127,90,28,52,69,95,72,54,89,85,21,39,77,35,30,22,62,70,8,1,20,65,5,92,80,17,95,87,105,98,5,23,57,110,124,31,29,20,13,127];
        this.setState({statusArr: patchArr});
        for (let i = 0; i < patchArr.length; i++) {
            this.updateOneParam(i, patchArr[i]);
        }
    }

    onColumnSelect = ({key}) => {
        this.setState({viewColumns: key});
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
            color: "gray"
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
                    <div className="synthToolbox">
                        {this.state.conToSynth 
                        ? <div>Connected to Synth<button className="synthToolButton" onClick={this.randomPatch}>Randomize Patch</button></div>
                        : <button className="synthToolButton" onClick={() => {this.recieveCC(); this.randomPatch();}}>Connect to Synth</button>}

                        <button className="synthToolButton" onClick={this.loadPatch}>Load Preset 1</button>
                        
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
                                this.playNoteToSynth(midiNumber)
                            }}
                            stopNote={(midiNumber) => {
                                this.stopNoteToSynth(midiNumber)
                            }}
                            // width={1000}
                            keyboardShortcuts={keyboardShortcuts}
                        />
                    </div>

                    <div style={{ columnCount: this.state.viewColumns}}>                    


                        {statusArr.length <= 0
                        ? <div className="status-div">Loading params</div>
                        : statusArr.map((param, index) => (
                            
                        <div key={index} style={index === this.state.highlightedParam ? {color:'red'} : {}}>
                            
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

                </div>
            </div>
        );
    }
}
  
const LocalSynthWithSocket = props => (
    <SocketContext.Consumer>
    {socket => <LocalSynth {...props} socket={socket} />}
    </SocketContext.Consumer>
  )
    
  export default LocalSynthWithSocket;