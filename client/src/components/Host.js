import React, { Component } from "react";

import Synth from "./Synth"


class Host extends Component {
    constructor(props){
      super(props);
      this.state = {
        data: []
        
      };
   }


    render() {
  
      return (
        
        <div>
          Hosting page

        <Synth />

        </div>
      );
    }
  }
  
  export default Host;