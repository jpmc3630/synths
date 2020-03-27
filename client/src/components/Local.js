import React, { Component } from "react";
import { Redirect } from 'react-router-dom'
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
          
          <div className="container">
            Local Mode

          <LocalSynth />

          </div>
        )
    }
  }
  
  export default Local;