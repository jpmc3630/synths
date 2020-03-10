import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js'

import { render } from "react-dom";
import { Knob } from "react-rotary-knob";
import * as skins from "react-rotary-knob-skin-pack";

// import Slider from '@material-ui/core/Slider';
// import TouchKnob from "react-touch-knob"


class Synth extends Component {
    constructor(props){
      super(props);
      this.state = {
        statusArr: [],
        highlightedParam: null,
        inputs: [],
        outputs: [],
        conToSynth: false,
        value: 50,
        paramCount: 75,
        currentRoom: null
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

        this.props.socket.on('CC', (data) => {
            console.log('recieved CC message:');
            console.log(data);
            this.updateOneParam(data.param, data.value);
          });

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
        input.addListener('controlchange', "all", (e) => {
        //   console.log("Received 'controlchange' message.", e);
        //   console.log(e.controller.number);
        //   console.log(e.value);
            
        this.updateOneParam(e.controller.number, e.value);
        this.handleSliderChange(e.controller.number, e.value)
            
        });
        this.setState({conToSynth: true});
        this.addHost();
    }

    updateOneParam(i, v){

        let rv = Math.round(v);

        if (rv != this.state.statusArr[i]) {
            console.log(rv)
            const newArr = this.state.statusArr;
            
            // this.handleSliderChange(i, rv)
            newArr[i] = rv;
            this.setState({statusArr: newArr});

            this.CC(i, rv);
        }
    };

    handleSliderChange(i, e) {
        if (typeof e === 'number') {
            let target = document.querySelectorAll('.MuiSlider-root')[i];
            let thumb = document.querySelectorAll('.MuiSlider-thumb')[i];
            let input = target.querySelector('input');
            let track = target.querySelector('.MuiSlider-track');
            let label = target.querySelector('.PrivateValueLabel-label-25');
            input.value = Math.round(e);
            thumb.style.left = `${Math.round(e) / 1.27}%`;
            thumb.setAttribute('aria-valuenow', Math.round(e));
            track.style.width = `${Math.round(e) / 1.27}%`;
            label.textContent = Math.round(e);
        } else {
            let value = e.target.getAttribute('aria-valuenow');

            if (value) {
                let rv = Math.round(value);
                const newArr = this.state.statusArr;
                newArr[i] = rv;
                this.setState({statusArr: newArr});
            }
        }
    };

    sliderChange = (i, v) => {
        // let tempArr = this.state.statusArr;
        // tempArr[param] = val;
        // this.setState({statusArr: tempArr});
        console.log(i);
        console.log('2: '+ v);
        // let target = document.querySelectorAll('.slidecontainer')[i];
        // let input = target.querySelector('value');
        // console.log(input);
    }

    render() {
  
        // var slider = document.getElementById("myRange");
 
        // // Update the current slider value (each time you drag the slider handle)
        // slider.oninput = function() {
        //   output.innerHTML = this.value;
        // }

        const knobStyle = {
            width: "40px",
            height: "40px",
            display: "inline-block",
          };

          const sliderStyle = {
            width: "150px",
            height: "10px",
            display: "inline-block"
          };

        const { statusArr } = this.state;
        return (
            <div className="container-fluid pb-3">
                <div className="row justify-content-md-center">
                
                {this.state.conToSynth ? 
                <div>Connected to Synth<button onClick={this.randomPatch}>Randomize Patch</button></div>
                
                : <button onClick={() => {this.recieveCC(); this.randomPatch();}}>Connect to Synth</button>
                }

                <div style={{ columnCount:4}}>
                
                    {statusArr.length <= 0
                    ? <div className="status-div">Loading params</div>
                    : statusArr.map((param, asd) => (
                        <div key={asd}>
                        {asd} : {param}
                        <Knob 
                            key={'paramknob' + asd}
                            onChange={this.updateOneParam.bind(this, asd)} 
                            clampMin={0} clampMax={360} rotateDegrees={180}
                            min={0} max={127} 
                            value={this.state.statusArr[asd]}
                            preciseMode={true} 
                            style={knobStyle}
                            skin={skins.s15}
                        />
                            
                        {/* <Slider
                            key={'paramslider' + asd}
                            defaultValue={this.state.statusArr[asd]}
                            
                            onChange={this.handleSliderChange.bind(this, asd)}
                            
                            aria-labelledby="input-slider"
                            min={0} max={127} style={sliderStyle}
                            valueLabelDisplay="auto"
                        /> */}


                    {/* <div className="slidecontainer">
                        <input type="range" min="1" max="127" defaultValue={this.state.statusArr[asd]} onInput={this.sliderChange.bind(this)} className="slider" id="myRange"></input>
                    </div> */}

                        
{/* 
                    <TouchKnob
                        class="my-knob-class"
                        name="score"
                        min="0"
                        max="127"
                        value={this.state.statusArr[asd]}
                        
                        onEnd={this.sliderChange.bind(asd, this)}
                        showNumber={true} 
                        round={true}
                        fineness={2}
                        /> */}

                        </div>
                        // this.state.highlightedParam === index ?
                        // (<div key={'param' + index} style={{color: 'red'}}>{index} : {param}</div>)
                        // : (<div key={'param' + index}>{index} : {param}</div>)

                       
//                        <Knob onChange={this.changeValue.bind(this)} min={0} max={100} value={this.state.statusArr[index]}/>

                    ))}
                </div>

            </div>
          </div>
        );
    }
}
  
const SynthWithSocket = props => (
    <SocketContext.Consumer>
    {socket => <Synth {...props} socket={socket} />}
    </SocketContext.Consumer>
  )
    
  export default SynthWithSocket;