const express = require("express");
const app = express();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
  },
});

var chatHistory = [];
var numUsersOnline = 0;

io.on("connection", (socket) => {
  io.emit("chat message", chatHistory);
  numUsersOnline++;
  io.emit("numUsersRead", numUsersOnline);
  console.log(`client connected: ${socket.id}, ${numUsersOnline} online`);

  socket.on("join-room", (joinRoomID) => {
    socket.join(joinRoomID);
  });

  socket.on("disconnect", () => {
    numUsersOnline--;
    io.emit("numUsersRead", numUsersOnline);
    console.log(`user disconnected, ${numUsersOnline} online`);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
