const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 3001;
const app = express();


// pp tutorial stuff
const bodyParser = require('body-parser')
const morgan = require('morgan')
const session = require('express-session')
const dbConnection = require('./database') 
const MongoStore = require('connect-mongo')(session)
const passport = require('./passport');

const user = require('./routes/user')

app.use(morgan('dev'))
app.use(
	bodyParser.urlencoded({
		extended: false
	})
)
app.use(bodyParser.json())

// Sessions
app.use(
	session({
		secret: 'fraggle-rock', //pick a random string to make the hash that is generated secure
		store: new MongoStore({ mongooseConnection: dbConnection }),
		resave: false, //required
		saveUninitialized: false //required
	})
)

// Passport
app.use(passport.initialize())
app.use(passport.session()) // calls the deserializeUser


// Routes
app.use('/user', user)








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
    socket.on('sendConfig', function(data) {
      io.sockets.in(data.room).emit('sendConfig', data.msg);
    });
    socket.on('Note', function(data) {
      console.log('passing Note message:');
      console.log(data);
      io.sockets.in(data.room).emit('Note', data.msg);
    });
    socket.on('CC', function(data) {
      console.log('passing CC message:');
      console.log(data);
      io.sockets.in(data.room).emit('CC', data.msg);
    });
    socket.on('Func', function(data) {
      console.log('passing Func message:');
      console.log(data);
      io.sockets.in(data.room).emit('Func', data.msg);
    });

    
    socket.on('removeUser', function(data) {
      console.log('passing removeUser message:');
      console.log(data);
      io.sockets.in(data.room).emit('removeUser', data.msg);
      for(let i=0; i < hostsArr.length; i++){         
        if(hostsArr[i].room === data.room){
            hostsArr[i].userCount--; 
        }
    }
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


    //web rtc stuff


    
    socket.on('initiate-video', function(data) {
      console.log('passing initate-video message:');
      console.log(data);
      io.sockets.in(data.room).emit('initiate-video', data.msg);
    });



    socket.on("call-user", data => {
      socket.to(data.to).emit("call-made", {
        offer: data.offer,
        socket: socket.id
        //  data.to is the JOINER socketID i think
        // socket.id is the hosts socketID i think
      });

      console.log('socket.id :');
      console.log(socket.id);
      console.log('data.to:');
      console.log(data.to);

      console.log('call user');

    });
    
    socket.on("make-answer", data => {
      socket.to(data.to).emit("answer-made", {
        socket: socket.id,
        answer: data.answer
      });

      console.log('make answer');

    });





});


