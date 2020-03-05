import React, { Component } from "react";
import WebMidi from "webmidi";


class Synth extends Component {
    constructor(){
      super();
      this.state = {
        statusArr: [],
        highlightedParam: null,
        inputs: [],
        outputs: [],
        conToSynth: false
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
        for (let i = 0 ; i < 120; i++) {
            let rndNum = this.rndVal();
            
            // set the synth
            this.CC(i, rndNum);

            // set srray
            newStatusArr[i] = rndNum;
            
        }
        this.setState({statusArr: newStatusArr});
    }

    updateOneParam = (i, v) => {
        

        const newArr = this.state.statusArr;
        newArr[i] = v;
        this.setState({statusArr: newArr});
        this.setState({highlightedParam: i});
      };

    // adjust all notes
    recieveCC = () => {
        var input = WebMidi.getInputByName("UM-1");
        input.addListener('controlchange', "all", (e) => {
          console.log("Received 'controlchange' message.", e);
          console.log(e.controller.number);
          console.log(e.value);
            
            this.updateOneParam(e.controller.number, e.value);
            
        });
        this.setState({conToSynth: true});
    }


    render() {
  
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
                        this.state.highlightedParam === index ?
                        (<div key={'param' + index} style={{color: 'red'}}>{index} : {param}</div>)
                        : (<div key={'param' + index}>{index} : {param}</div>)

                    

                    ))}
                </div>

            </div>
          </div>
        );
    }
}
  
export default Synth;