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
const { joinLobbyFn, createRoomFn, joinRoomFn, leaveRoomFn, listRoomsFn } =
  require("./eventHandlers/lobbyHandler")(io);

/**
 * Instance Variables
 */
const rooms = {};
var numUsersOnline = 0;

/**
 * The starting point for a user connecting to our lovely little multiplayer
 * server!
 */
io.on("connection", (socket) => {
  socket.on("joinLobby", (playerID) => {
    numUsersOnline++;
    io.emit("numUsersRead", numUsersOnline);
    joinLobbyFn(playerID);
  });

  console.log({ socketInMain: socket, ioInMain: io });
  listRoomsFn();

  socket.on("createRoom", createRoomFn);
  socket.on("joinRoom", joinRoomFn);

  /**
   * Lets us know that players have joined a room and are waiting in the waiting room.
   */
  socket.on("roomReady", () => {
    console.log(socket.id, "is ready!");
    const room = rooms[socket.roomID];

    // Toggle ready mode when room has 4 players.
    if (room.sockets.length == 4) {
      // tell each player to start the game.
      for (const client of room.sockets) {
        client.emit("initGame");
      }
    }
  });

  socket.on("leaveRoom", leaveRoomFn);

  socket.on("declareReady", (playerID) => {});

  socket.on("disconnect", () => {
    numUsersOnline--;
    io.emit("numUsersRead", numUsersOnline);
    leaveRoomFn();
  });
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
