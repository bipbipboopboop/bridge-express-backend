const Room = require("../models/roomModel");
const Player = require("../models/playerModel");

module.exports = (io, socket) => {
  /**
   * Signal that a player has entered the website(lobby) upon connection.
   */
  const joinLobbyFn = async function (playerID) {
    await Player.findOneOrCreate({ playerID }, { playerID, room: null });
    const numUsersOnline = await Player.count();
    await io.emit("numUsersRead", numUsersOnline);
    socket.playerID = playerID;
    console.log(`playerID : ${playerID} has joined the lobby!`);
    listRoomsFn();
  };

  /**
   * Gets fired when a user wants to create a new room.
   * @param {string} roomName Name of the room.
   */
  const createRoomFn = async function (roomName) {
    try {
      const room = await Room.create({
        roomID: socket?.id?.slice(0, 4)?.toUpperCase(),
        name: roomName,
        players: [],
      });
      // console.log({ "createRoomFn:room": room });
      await joinRoomFn(room.roomID);
      listRoomsFn();
    } catch (err) {
      handleError("createRoomFn", err);
    }
  };

  /**
   * Connect a socket to a specified room
   * @param {string} roomID An object that represents a room from the `rooms` instance variable object
   */
  const joinRoomFn = async function (roomID) {
    try {
      const playerID = socket.playerID;
      const player = await Player.findOne({ playerID });
      if (!player) throw new Error(`Player of ID : ${playerID} is not found!`);
      await player.joinRoom(roomID);
      console.log(`Player ${playerID} has joined room ${roomID}`);
      listRoomsFn();
    } catch (err) {
      handleError("joinRoomFn", err);
    }
  };

  /**
   * Make the socket leave any room that it is a part of
   */
  const leaveRoomFn = async function () {
    // console.log({ socketInLeaveRoomFn: socket });
    const playerID = socket.playerID;
    const player = await Player.findOne({ playerID });

    console.log(`leaveRoomFn : player ${player}`);

    try {
      // Remove room from player instance and remove player from the `players` array of the room instance.
      await player.leaveRoom();
      listRoomsFn();
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

  const declareReadyFn = () => {};

  /**
   * Returns all rooms in an array.
   */
  const listRoomsFn = async function () {
    const allRooms = await Room.find();
    // console.log({ "listRooms:allRooms": allRooms });
    io.emit("listRooms", allRooms);
  };

  const handleError = function (fnName, err) {
    console.log(`Error occured at ${fnName} : ${err.message}`);
    socket.emit("error", err.message);
  };

  socket.on("joinLobby", joinLobbyFn);
  socket.on("createRoom", createRoomFn);
  socket.on("joinRoom", joinRoomFn);
  socket.on("leaveRoom", leaveRoomFn);

  socket.on("declareReady", declareReadyFn);

  socket.on("disconnecting", disconnectingFn);
};
