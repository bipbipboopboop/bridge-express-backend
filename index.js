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

io.on("connection", (socket) => {
  console.log(`client connected: ${socket.id}`);

  socket.on("connect", () => {
    chatHistory = chatHistory.concat(msg);
    console.log({ chatHistory });
    io.emit("chat message", chatHistory);
  });

  socket.on("chat message", (msg) => {
    chatHistory = chatHistory.concat(msg);
    console.log({ chatHistory });
    io.emit("chat message", chatHistory);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
