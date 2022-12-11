const mongoose = require("mongoose");
const Room = require("./roomModel");

const Schema = mongoose.Schema;

const playerSchema = new Schema(
  {
    playerID: {
      type: String,
      required: true,
      unique: true,
    },
    room: { type: Schema.Types.ObjectId, ref: "Room" },
  },
  { timestamps: true }
);

playerSchema.statics.findOneOrCreate = async function (
  condition,
  defaultValue
) {
  const player = await this.findOne(condition);
  if (player) {
    return player;
  } else {
    return this.create(defaultValue);
  }
};

/**
 * Join a room instance that the `player` instance might be in.
 * @param roomID The id of a room.
 */
playerSchema.methods.joinRoom = async function (roomID) {
  const roomInstance = await Room.findOne({ roomID });
  console.log(`player.joinRoom.roomInstance : ${roomInstance}`);
  if (!roomInstance) {
    throw `Room ${roomID} is not found! Please try another room!`;
  }

  // A player can only join the room if the room has space left. Check this case first.
  const newRoomHasSpace = roomInstance.players.length < 4;
  if (!newRoomHasSpace) {
    throw `Room ${roomInstance.roomID} is full! Please try another room!`;
  }

  await this.leaveRoom();
  this.room = roomInstance;

  await roomInstance.addPlayer(this);
  await this.save();
  console.log(`player.joinRoom: player = ${this}`);
};

/**
 * Leave any room that the player might be in.
 */
playerSchema.methods.leaveRoom = async function () {
  // A player can only leave a room if they are already in a room.
  if (!this.room) {
    console.log(`Player ${this.playerID} is not in any room!`);
    return;
  }
  await this.populate("room");
  console.log(`(${this.playerID})player.leaveRoom: room = ${this.room}`);
  // Remove room from player instance.

  const oldRoom = this.room;
  this.room = null;
  await oldRoom.removePlayer(this);
  await this.save();
  if (oldRoom.players.length === 0)
    await Room.deleteOne({ roomID: oldRoom.roomID });
};
module.exports = mongoose.model("Player", playerSchema);
