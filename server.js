const dotenv = require("dotenv");
const app = require("express")();
const server = require("http").createServer(app);

// Database setup
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
dotenv.config();
const Room = require("./models/roomModel");
const Player = require("./models/playerModel");

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
const gameStates = {}; // An object to store the state of each game(room) as value, and can be indexed by using the roomID of the room.

/**
 * Returns all rooms in an array.
 * room = {
 *  roomID: String,
 *  name: String,
 *  players: [],
 * }
 */
const listRooms = async () => {
  const allRooms = await Room.find();
  console.log({ listRooms: allRooms });
  io.emit("listRooms", allRooms);
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
    socket.roomID = room.id;
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

const leaveLobby = (socket) => {
  numUsersOnline--;
  console.log(`${socket.playerID} has left the lobby`);
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
  socket.on("joinLobby", async (playerID) => {
    numUsersOnline++;
    io.emit("numUsersRead", numUsersOnline);
    const player = await Player.findOneOrCreate({ playerID });
    console.log({ player });
    socket.playerID = playerID;
    console.log(`playerID : ${playerID} has joined the lobby!`);
  });

  listRooms();

  /**
   * Gets fired when a user wants to create a new room.
   */
  socket.on("createRoom", async (roomName) => {
    // room : {
    //   roomID: String,
    //   name: String,
    //   players: [ObjectID{}],
    // }

    const createRoomFn = async (roomName) => {
      try {
        const firstPlayer = await Player.findOne({
          playerID: socket?.playerID,
        });
        const room = await Room.create({
          roomID: socket?.id?.slice(0, 4)?.toUpperCase(),
          name: roomName,
          players: [firstPlayer],
        });
        return room.populate("players");
      } catch (err) {
        console.log(`Error occured at createRoomFn : ${err.message}`);
        socket.emit("error", err.message);
      }
    };

    const room = await createRoomFn(roomName);

    console.log({ room });

    // const socketNotInAnyRoom = socket?.rooms?.size === 1; // Socket will always be in a room of <client.id>

    // if (socketNotInAnyRoom) {
    //   rooms[room.id] = room;
    //   joinRoomFn(socket, room);
    // }
  });

  /**
   * Listens to player join room event, fires when a player joins a room
   */
  socket.on("joinRoom", (roomID, callback) => {
    console.log({ "joinRoom.roomID": roomID });
    const room = rooms[roomID];

    if (room) {
      const isSocketInRoom = room.sockets.includes(socket);
      const isRoomFull = room.sockets.length >= 4;
      const canJoin = !isSocketInRoom && !isRoomFull;
      if (canJoin) {
        joinRoomFn(socket, room);
        callback({
          status: 200,
          err: null,
        });
      } else if (isRoomFull) {
        callback({
          status: 404,
          err: `Room ${roomID} is full!`,
        });
      } else {
        callback({
          status: 404,
          err: `You're already in room ${roomID}`,
        });
      }
    } else {
      callback({
        status: 404,
        err: `Room ID : ${roomID} doesn't exist! Please try again`,
      });
    }

    // callback();
  });

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

  socket.on("leaveRoom", () => {
    leaveRoom(socket);
    listRooms();
  });

  socket.on("declareReady", (playerID) => {});

  socket.on("disconnect", () => {
    leaveLobby(socket);
    leaveRoom(socket);
  });
});

console.log(process.env.MONG_URI);

mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log("listening on *:3000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
