const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // React app
    methods: ["GET", "POST"]
  }
});

app.use(cors());

let messages = [];
let connectedUsers = new Set(); // To keep track of connected usernames

io.on('connection', (socket) => {
  console.log('New user connected');

  // Emit existing messages to the new user
  socket.emit('chatHistory', messages);

  socket.on('setUser', (userName) => {
    if (connectedUsers.size < 5) {
      connectedUsers.add(userName);
      socket.userName = userName; // Store the username in the socket
      io.emit('userConnected', Array.from(connectedUsers)); // Broadcast the user list
    } else {
      socket.emit('userLimitReached'); // Notify that the limit is reached
    }
  });

  socket.on('sendMessage', (message) => {
    messages.push(message);
    io.emit('receiveMessage', message); // Broadcast message to all users
  });

  socket.on('disconnect', () => {
    if (socket.userName) {
      connectedUsers.delete(socket.userName);
      io.emit('userDisconnected', Array.from(connectedUsers)); // Update user list
    }
    console.log('User disconnected');
  });
});

const PORT = 5000; 
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
