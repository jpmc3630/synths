import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js'

import { render } from "react-dom";
import { Knob } from "react-rotary-knob";
import * as skins from "react-rotary-knob-skin-pack";

import Slider from '@material-ui/core/Slider';

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
        currentRoom: this.props.currentRoom
      };
    }
    

    componentDidMount() {


        this.props.socket.on('status', data => {
            console.log('Recievy the status');
            console.log('Incoming statusArr:', data);
            this.setState({ statusArr: data })
        });

        // WebMidi.enable( (err) => {
        //     console.log(WebMidi.inputs);
        //     console.log(WebMidi.outputs);
            
        // }, true);   

        this.requestStatusArr();

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

    }


    // adjust all notes
    recieveStatus = () => {
        
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
        console.log(v)
        let rv = Math.round(v);
        const newArr = this.state.statusArr;
        this.handleSliderChange(i, rv)
        newArr[i] = rv;
        this.setState({statusArr: newArr, highlightedParam: i});
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

                this.props.socket.emit('CC', {room: this.state.currentRoom, msg: { param: i, value: rv}});

            }
        }
    };


    render() {
  
        const knobStyle = {
            width: "40px",
            height: "40px",
            display: "inline-block"
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
                
                <button onClick={this.requestRandomPatch}>Request Random Patch</button>
                
                <div style={{ columnCount:4}}>
                
                    {statusArr.length <= 0
                    ? <div className="status-div">Loading params...</div>
                    : statusArr.map((param, index) => (
                        <div key={'param' + index}>
                        {index} : {param}
                        {/* <Knob 
                            key={'paramknob' + index}
                            onChange={this.updateOneParam.bind(this, index)} 
                            clampMin={0} clampMax={360} rotateDegrees={180}
                            min={0} max={127} 
                            value={this.state.statusArr[index]}
                            preciseMode={false} style={knobStyle}
                            skin={skins.s15}
                        /> */}
                            
                        <Slider
                            key={'paramslider' + index}
                            defaultValue={this.state.statusArr[index]}
                            onChange={this.handleSliderChange.bind(this, index)}
                            aria-labelledby="input-slider"
                            min={0} max={127} style={sliderStyle}
                            valueLabelDisplay="auto"
                        />

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
  
const RemoteSynthWithSocket = props => (
    <SocketContext.Consumer>
    {socket => <RemoteSynth {...props} socket={socket} />}
    </SocketContext.Consumer>
  )
    
  export default RemoteSynthWithSocket;