const dotenv = require("dotenv");
const app = require("express")();
const server = require("http").createServer(app);

/**
 * Database Setup
 */
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
dotenv.config();

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
  },
});

/**
 * Handler Setup
 */
// const { joinLobbyFn, createRoomFn, joinRoomFn, leaveRoomFn, listRoomsFn } =
//   require("./eventHandlers/lobbyHandler")(io);
const registerLobbyHandlers = require("./eventHandlers/lobbyHandler");

/**
 * The starting point for a user connecting to the server!
 */
io.on("connection", (socket) => {
  registerLobbyHandlers(io, socket);
});

mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    server.listen(process.env.PORT || 3000, () => {
      console.log("listening on *:3000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
