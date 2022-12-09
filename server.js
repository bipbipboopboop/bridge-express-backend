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

const listRooms = () => {
  // const room = {
  //   id: socket?.id,
  //   name: roomName,
  //   sockets: [],
  // };
  const roomList = Object.keys(rooms)?.map((key) => {
    const room = rooms[key];
    const roomInfo = {
      id: room?.id,
      name: room?.name,
      sockets: room?.sockets?.map((skt) => skt?.id),
    };
    return roomInfo;
  });

  // console.log({ roomList: rooms });

  io.emit("listRooms", roomList);
};

/**
 * Connect a socket to a specified room
 * @param socket A connected socket.io socket
 * @param room An object that represents a room from the `rooms` instance variable object
 */
const joinRoomFn = (socket, room) => {
  if (room) {
    room.sockets.push(socket);
    socket.join(room.id);
    socket.roomId = room.id;
    console.log(socket.id, "Joined", room.id);
    listRooms();
    // console.log("socket is", socket);
  } else {
    console.log(`room doesn't exist!`);
  }
};

/**
 * Make the socket leave any room that it is a part of
 * @param socket A connected socket.io socket
 */
const leaveRoom = (socket) => {
  const roomsToDelete = [];
  for (const id in rooms) {
    const room = rooms[id];
    if (room.sockets.includes(socket)) {
      socket.leave(id);
      console.log(`${socket?.id} has left the room ${room?.id}`);
      // remove the socket from the room object
      room.sockets = room.sockets.filter((item) => item !== socket);
    }
    // Prepare to delete any rooms that are now empty
    if (room.sockets.length == 0) {
      roomsToDelete.push(room);
    }
    listRooms();
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

const leaveLobby = (reason) => {
  numUsersOnline--;
  io.emit("numUsersRead", numUsersOnline);
};

/**
 * The starting point for a user connecting to our lovely little multiplayer
 * server!
 */
io.on("connection", (socket) => {
  /**
   * Signal that a player has entered the website(lobby) upon connection.
   */
  console.log(`${socket?.id} has joined`);
  joinLobby();
  listRooms();

  /**
   * Gets fired when a user wants to create a new room.
   */
  socket.on("createRoom", (roomName) => {
    const room = {
      id: socket?.id?.slice(0, 4)?.toUpperCase(),
      name: roomName,
      sockets: [],
    };
    rooms[room.id] = room;

    joinRoomFn(socket, room);
    // console.log({ room });
    // callback();
  });

  /**
   * Listens to player join room event, fires when a player joins a room
   */
  socket.on("joinRoom", (roomId, callback) => {
    console.log({ "joinRoom.roomId": roomId });
    const room = rooms[roomId];

    if (room) {
      joinRoomFn(socket, room);
      callback({
        status: 200,
        err: null,
      });
    } else {
      callback({
        status: 404,
        err: `Room ID : ${roomId} doesn't exist! Please try again`,
      });
    }

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

  socket.on("disconnect", () => {
    leaveLobby();
    leaveRoom(socket);
  });
});

server.listen(PORT, () => {
  console.log("listening on *:3000");
});
