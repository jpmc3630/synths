import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js'

// import Slider from '@material-ui/core/Slider';



class HostSynth extends Component {
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

        //receive CC is disabled for now

        // input.addListener('controlchange', "all", (e) => {
        // //   console.log("Received 'controlchange' message.", e);
        // //   console.log(e.controller.number);
        // //   console.log(e.value);
            
        // this.updateOneParam(e.controller.number, e.value);
        // this.handleSliderChange(e.controller.number, e.value)
            
        // });
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
            this.setState({statusArr: newArr, highlightedParam: i});

            this.CC(i, rv);
        }
    };

    // handleSliderChangeOLD(i, e) {
        
    //     if (typeof e === 'number') {
    //         let target = document.querySelectorAll('.MuiSlider-root')[i];
    //         let thumb = document.querySelectorAll('.MuiSlider-thumb')[i];
    //         let input = target.querySelector('input');
    //         let track = target.querySelector('.MuiSlider-track');
    //         let label = target.querySelector('.PrivateValueLabel-label-25');
    //         input.value = Math.round(e);
    //         thumb.style.left = `${Math.round(e) / 1.27}%`;
    //         thumb.setAttribute('aria-valuenow', Math.round(e));
    //         track.style.width = `${Math.round(e) / 1.27}%`;
    //         label.textContent = Math.round(e);
    //     } else {
    //         let value = e.target.getAttribute('aria-valuenow');

    //         if (value) {
    //             let rv = Math.round(value);
    //             const newArr = this.state.statusArr;
    //             newArr[i] = rv;
    //             this.setState({statusArr: newArr});
    //         }
    //     }
    // };
    
    handleSliderChange = (event, newValue) => {
        
        if (event.target.classList.contains("MuiSlider-thumb")) {
            if (event.target.parentNode.dataset.slider) {
            console.log(event.target.parentNode.dataset.slider);
            console.log(newValue);
            this.updateOneParam(parseInt(event.target.parentNode.dataset.slider), newValue);
            console.log('option 1');
            }
        } else {
            if (event.target.dataset.slider) {
            this.updateOneParam(parseInt(event.target.dataset.slider), newValue);
            console.log(event.target.dataset.slider);
            console.log(newValue);
            console.log('option 2');
            }
        }
    };



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
                    : statusArr.map((param, index) => (
                        <div key={index} style={index === this.state.highlightedParam ? {color:'red'} : {}}>
                        {index} : {param}
                
                            {/* <Slider
                                    value={this.state.statusArr[index]}
                                    onChange={this.handleSliderChange}
                                    aria-labelledby="input-slider"
                                    data-slider={index} 
                                    min={0} 
                                    max={127} 
                                    color={'secondary'} 
                                    style={sliderStyle}
                            /> */}

                        </div>

                    ))}
                </div>

            </div>
          </div>
        );
    }
}
  
const HostSynthWithSocket = props => (
    <SocketContext.Consumer>
    {socket => <HostSynth {...props} socket={socket} />}
    </SocketContext.Consumer>
  )
    
  export default HostSynthWithSocket;