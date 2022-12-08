const express = require("express");
const http = require("http");
const app = express();

const server = http.createServer(app);
console.log(server);

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
  io.emit("online_users:read", numUsersOnline);
  console.log(`client connected: ${socket.id}, ${numUsersOnline} online`);

  socket.on("chat message", (msg) => {
    chatHistory = chatHistory.concat(msg);
    console.log({ chatHistory });
    io.emit("chat message", chatHistory);
  });

  socket.on("disconnect", () => {
    numUsersOnline--;
    io.emit("online_users:read", numUsersOnline);
    console.log(`user disconnected, ${numUsersOnline} online`);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
