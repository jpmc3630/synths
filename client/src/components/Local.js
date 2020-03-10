import React, { Component } from "react";

import LocalSynth from "./LocalSynth"


class Local extends Component {
    constructor(props){
      super(props);
      this.state = {
        data: []
        
      };
   }


    render() {
  
      return (
        
        <div>
          Local Mode

        <LocalSynth />

        </div>
      );
    }
  }
  
  export default Local;