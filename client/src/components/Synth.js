import React, { Component } from "react";
import WebMidi from "webmidi";

import { render } from "react-dom";
import { Knob } from "react-rotary-knob";
import * as skins from "react-rotary-knob-skin-pack";

import Slider from '@material-ui/core/Slider';

class Synth extends Component {
    constructor(){
      super();
      this.state = {
        statusArr: [],
        highlightedParam: null,
        inputs: [],
        outputs: [],
        conToSynth: false,
        value: 50
      };
    }
   
    componentDidMount() {

        WebMidi.enable( (err) => {
            console.log(WebMidi.inputs);
            console.log(WebMidi.outputs);
            
            //connect automatically, generate random patch while in dev
            // this.recieveCC();
            // this.randomPatch();

        }, true);
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




        // console.log(val);
        // console.log(i);
        // this.setState(state => {
        //   const newArr = state.statusArr.map((item, j) => {
        //     if (j === i) {
        //       return v;
        //     } else {
        //       return item;
        //     }
        //   });
        //   return {
        //     statusArr: newArr,
        //     highlightedParam: i
        //   };
        // });



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
                this.setState({statusArr: newArr, highlightedParam: i});
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
                
                {this.state.conToSynth ? 
                <div>Connected to Synth<button onClick={this.randomPatch}>Randomize Patch</button></div>
                
                : <button onClick={() => {this.recieveCC(); this.randomPatch();}}>Connect to Synth</button>
                }

                <div style={{ columnCount:4}}>
                
                    {statusArr.length <= 0
                    ? <div className="status-div">Loading params</div>
                    : statusArr.map((param, index) => (
                        <div key={'param' + index}>
                        {index} : {param}
                        <Knob 
                            key={'paramknob' + index}
                            onChange={this.updateOneParam.bind(this, index)} 
                            clampMin={0} clampMax={360} rotateDegrees={180}
                            min={0} max={127} 
                            value={this.state.statusArr[index]}
                            preciseMode={false} style={knobStyle}
                            skin={skins.s15}
                        />
                            
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
  
export default Synth;