const Room = require("../models/roomModel");
const Player = require("../models/playerModel");

module.exports = (io, socket) => {
  /**
   * Signal that a player has entered the website(lobby) upon connection.
   */
  const joinLobbyFn = async function (playerID) {
    const player = await Player.findOneOrCreate({ playerID, room: null });
    const numUsersOnline = await Player.count();
    await io.emit("numUsersRead", numUsersOnline);
    console.log({ player });
    socket.playerID = playerID;
    console.log(`playerID : ${playerID} has joined the lobby!`);
    listRoomsFn();
  };

  /**
   * Gets fired when a user wants to create a new room.
   * @param roomName Name of the room.
   */
  const createRoomFn = async function (roomName) {
    try {
      const firstPlayer = await Player.findOne({
        playerID: socket?.playerID,
      });
      const room = await Room.create({
        roomID: socket?.id?.slice(0, 4)?.toUpperCase(),
        name: roomName,
        players: [firstPlayer],
      });
      console.log({ "createRoomFn:room": room });
      await joinRoomFn(room.roomID);
      listRoomsFn();
    } catch (err) {
      handleError("createRoomFn", err);
    }
  };

  /**
   * Connect a socket to a specified room
   * @param socket A connected socket.io socket
   * @param room An object that represents a room from the `rooms` instance variable object
   */
  const joinRoomFn = async function (roomID, playerID) {
    try {
      const room = await Room.findOne({ roomID });
      const player = await Player.findOne({ playerID });
      room.addPlayer(player);
      console.log(`Player ${playerID} has joined room ${roomID}`);
    } catch (err) {
      handleError("joinRoomFn", err);
    }
  };

  /**
   * Make the socket leave any room that it is a part of
   * @param socket A connected socket.io socket
   */
  const leaveRoomFn = async function () {
    // console.log({ socketInLeaveRoomFn: socket });
    const playerID = socket.playerID;
    const player = await Player.findOne({ playerID });

    try {
      // Remove room from player instance and remove player from the `players` array of the room instance.
      const room = await player.leaveRoom(); // First remove the room from the player instance.
      if (room) {
        // room will be null if the player is not in any room.
        console.log(`playerID : ${playerID} has left the room ${room.roomID}!`);
        await room.removePlayer(player); // Then remove the player from the room.
      }
    } catch (err) {
      handleError("leaveRoomFn", err);
    }
  };

  const disconnectingFn = async function () {
    await leaveRoomFn();
    const playerID = socket.playerID;
    console.log(`playerID:${playerID} has left the lobby!`);
    await Player.findOneAndDelete({ playerID });
    const numUsersOnline = await Player.count();
    await io.emit("numUsersRead", numUsersOnline);
  };

  /**
   * Returns all rooms in an array.
   * room = {
   *  roomID: String,
   *  name: String,
   *  players: [{Player Instance}],
   * }
   */
  const listRoomsFn = async function () {
    const allRooms = await Room.find();
    console.log({ "listRooms:allRooms": allRooms });
    io.emit("listRooms", allRooms);
  };

  // socket.on("roomReady", () => {
  //   console.log(socket.id, "is ready!");
  //   const room = rooms[socket.roomID];

  //   // Toggle ready mode when room has 4 players.
  //   if (room.sockets.length == 4) {
  //     // tell each player to start the game.
  //     for (const client of room.sockets) {
  //       client.emit("initGame");
  //     }
  //   }
  // });

  const handleError = function (fnName, err) {
    console.log(`Error occured at ${fnName} : ${err.message}`);
    socket.emit("error", err.message);
  };

  socket.on("joinLobby", joinLobbyFn);
  socket.on("createRoom", createRoomFn);
  socket.on("joinRoom", joinRoomFn);
  socket.on("leaveRoom", leaveRoomFn);
  socket.on("disconnecting", disconnectingFn);
};
