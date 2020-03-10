const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 3001;
const app = express();



// Define middleware here
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

// socket route




// Define API routes here

// Send every other request to the React app
// Define any API routes before this runs
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`🌎 ==> API server now on port ${PORT}!`);
});


// set up socket.io from our express connection
var io = require('socket.io')(server);
let hostsArr = [];

// handle incoming connections from clients
io.sockets.on('connection', function(socket) {

    // sending the list of hosts to joiners
      socket.on('getHosts', function(data) {
        console.log('New joiner. Their ID is:');
        console.log(data);
        io.to(`${socket.id}`).emit('getHosts', hostsArr);
        console.log('sending list of rooms...');
        console.log(hostsArr);

        // io.sockets.in(getHostsRoom).emit('message', 'host1, host2, host3');
      
    });

    // sorting out room creation for hosts ... 
    // once a client has connected, we expect to get a ping from them saying what room they want to join
    socket.on('room', function(roomName) {

        socket.join(roomName);
        console.log('room message recieved:' + roomName);
        
        hostsArr.push({
          room: roomName,
          hostSocket: socket.id,
          userCount: 0
        });

        io.sockets.emit('getHosts', hostsArr)
        io.sockets.in(roomName).emit('message', `You are now hosting as ${roomName}.`);
        console.log('New host has been created');
        console.log('Current hosts list is:')
        console.log(hostsArr);

    });

    // redirecting msgs to right room.
    socket.on('msg', function(data) {
      console.log(data.msg);
      io.sockets.in(data.room).emit('msg', data.msg);
    });
    // redirecting statusArr to right room
    socket.on('status', function(data) {
      console.log('passing status message:');
      console.log(data);
      io.sockets.in(data.room).emit('status', data.msg);
    });
    socket.on('CC', function(data) {
      console.log('passing CC message:');
      console.log(data);
      io.sockets.in(data.room).emit('CC', data.msg);
    });


    // join room, for joiners
    socket.on('joinRoom', function(roomName) {

      socket.join(roomName);
      console.log('client join room message recieved:' + roomName);
      
      for(let i=0; i < hostsArr.length; i++){         
        if(hostsArr[i].room === roomName){
            hostsArr[i].userCount++; 
        }
    }
      io.sockets.emit('getHosts', hostsArr)
      io.sockets.in(roomName).emit('message', `New user has joined ${roomName}.`);
      console.log('message', `New user has joined ${roomName}.`);


  });
  
  // removeHost such as SYNTH component UNMOUNT. ie. Navigate away.
  socket.on('removeHost', function() {
      
    console.log('Host has removed itself');

      for(let i=0; i < hostsArr.length; i++){         
          if(hostsArr[i].hostSocket === socket.id){
              hostsArr.splice(i,1); 
          }
      }

      // send everybody a message saying the host as disconnected
      io.emit('exit', socket.id); 
      io.sockets.emit('getHosts', hostsArr)
      console.log(socket.id + ' has disconnected itself');
      console.log('Remaining hosts are:');
      console.log(hostsArr);

  });


    // on DISCONNECT or CLOSE TAB remove host from hosts list
    socket.on('disconnect', function(reason) {
      
      console.log('DISCONNECT');
      console.log(reason);

        for(let i=0; i < hostsArr.length; i++){         
            if(hostsArr[i].hostSocket === socket.id){
                hostsArr.splice(i,1); 
            }
        }

        // send everybody a message saying the host as disconnected
        io.emit('exit', socket.id); 
        io.sockets.emit('getHosts', hostsArr)
        console.log(socket.id + ' has disconnected');
        console.log('Remaining hosts are:');
        console.log(hostsArr);

    });

});
