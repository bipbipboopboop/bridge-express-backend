const app = require("express")();
const server = require("http").createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
  },
});

/**
 * Constants
 */
const PORT = process.env.PORT || 3000;

/**
 * Instance Variables
 */
const rooms = {};
var numUsersOnline = 0;

/**
 * Connect a socket to a specified room
 * @param socket A connected socket.io socket
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const joinRoomFn = (socket, room) => {
  room.sockets.push(socket);
  socket.join(room.id, () => {
    // store the room id in the socket for future use
    socket.roomId = room.id;
    console.log(socket.id, "Joined", room.id);
  });
};

/**
 * Make the socket leave any rooms that it is a part of
 * @param socket A connected socket.io socket
 */
const leaveRooms = (socket) => {
  const roomsToDelete = [];
  for (const id in rooms) {
    const room = rooms[id];
    // check to see if the socket is in the current room
    if (room.sockets.includes(socket)) {
      socket.leave(id);
      // remove the socket from the room object
      room.sockets = room.sockets.filter((item) => item !== socket);
    }
    // Prepare to delete any rooms that are now empty
    if (room.sockets.length == 0) {
      roomsToDelete.push(room);
    }
  }

  // Delete all the empty rooms that we found earlier
  for (const room of roomsToDelete) {
    delete rooms[room.id];
  }
};

const joinLobby = () => {
  numUsersOnline++;
  io.emit("numUsersRead", numUsersOnline);
};

const leaveLobby = () => {
  numUsersOnline--;
  io.emit("numUsersRead", numUsersOnline);
  leaveRooms();
};

/**
 * The starting point for a user connecting to our lovely little multiplayer
 * server!
 */
io.on("connection", (socket) => {
  /**
   * Signal that a player has entered the website(lobby) upon connection.
   */
  joinLobby();

  /**
   * Gets fired when a user wants to create a new room.
   */
  socket.on("createRoom", (roomName) => {
    const room = {
      id: socket?.id,
      name: roomName,
      sockets: [],
    };
    rooms[room.id] = room;

    joinRoomFn(socket, room);
    // callback();
  });

  /**
   * Listens to player join room event, fires when a player joins a room
   */
  socket.on("joinRoom", (roomId) => {
    const room = rooms[roomId];
    joinRoomFn(socket, room);
    // callback();
  });

  /**
   * Lets us know that players have joined a room and are waiting in the waiting room.
   */
  socket.on("roomReady", () => {
    console.log(socket.id, "is ready!");
    const room = rooms[socket.roomId];

    // Toggle ready mode when room has 4 players.
    if (room.sockets.length == 4) {
      // tell each player to start the game.
      for (const client of room.sockets) {
        client.emit("initGame");
      }
    }
  });
  socket.on("disconnect", leaveLobby);
});

server.listen(PORT, () => {
  console.log("listening on *:3000");
});
