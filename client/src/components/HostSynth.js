import React, { Component } from "react";
import WebMidi from "webmidi";
import SocketContext from '../context/socket-context.js'


class HostSynth extends Component {
    constructor(props){
      super(props);
      this.state = {
        statusArr: [],
        highlightedParam: null,
        inputs: [],
        outputs: [],
        conToSynth: false,
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

        this.props.socket.on('Func', (data) => {
            if (data === 'Random') {
                this.randomPatch();
            }
        });

    }

    sendStatusArr = () => {
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
        for (let i = 0 ; i < 120; i++) {
            let rndNum = this.rndVal();
            // set the synth
            this.CC(i, rndNum);
            // set srray
            newStatusArr[i] = rndNum;
        }
        this.setState({statusArr: newStatusArr});
        this.sendStatusArr();
    }

    // adjust all notes
    connectToSynth = () => {
        var input = WebMidi.getInputByName("UM-1");
        this.randomPatch();
        this.setState({conToSynth: true});
        this.addHost();
    }

    updateOneParam(i, v){

        let rv = Math.round(v);

        if (rv != this.state.statusArr[i]) {
            console.log(rv)
            const newArr = this.state.statusArr;
            
            newArr[i] = rv;
            this.setState({statusArr: newArr, highlightedParam: i});

            this.CC(i, rv);
        }
    };


    render() {
        const { statusArr } = this.state;
        const sliderStyle = {
            width: "150px",
            height: "10px",
            display: "inline-block"
        };

        return (
            <div className="container-fluid pb-3">
                <div className="row justify-content-md-center">
                
                    {this.state.conToSynth 
                    ? <div>Connected to Synth</div>
                    : <button className="synthToolButton" onClick={this.connectToSynth}>Connect to Synth</button>
                    }

                    <div style={{ columnCount:4}}>
                
                    {statusArr.length <= 0
                    ? <div className="status-div">Loading params</div>
                    : statusArr.map((param, index) => (
                        <div key={index} style={index === this.state.highlightedParam ? {color:'red'} : {}}>
                        {index} : {param}

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