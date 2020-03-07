import React, { Component } from "react";
import io from "socket.io-client";

const socket = io();
console.log(socket);

class Join extends Component {
    constructor(){
      super();
      this.state = {
        data: []
      };
   }
  
  
    render() {
  
  
      return (
        
        <div>
          Join page

        </div>
      );
    }
  }
  
  export default Join;