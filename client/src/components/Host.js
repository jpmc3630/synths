import React, { Component } from "react";
import HostSynth from "./HostSynth"


class Host extends Component {
    constructor(props){
      super(props);
      this.state = {
        data: []
        
      };
   }


    render() {

          return (
            
            <div className="content">
              Host Synth
              <br/><br/>

            <HostSynth />

            </div>
          )
    }
  }
  
  export default Host;