const Room = require("./models/roomModel");
const Player = require("./models/playerModel");

module.exports = (io) => {
  const createRoomFn = async function (roomName) {
    const socket = this;
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

  const joinRoomFn = async function (roomID, playerID) {
    try {
      const room = await Room.findOne({ roomID });
      const player = await Player.findOne({ playerID });
      room.addPlayer(player);
    } catch (err) {
      handleError("joinRoomFn", err);
    }
  };

  const listRoomsFn = async function () {
    const allRooms = await Room.find();
    console.log({ "listRooms:allRooms": allRooms });
    io.emit("listRooms", allRooms);
  };

  const handleError = function (fnName, err) {
    const socket = this;
    console.log(`Error occured at ${fnName} : ${err.message}`);
    socket.emit("error", err.message);
  };

  return {
    createRoomFn,
    joinRoomFn,
    listRoomsFn,
  };
};
