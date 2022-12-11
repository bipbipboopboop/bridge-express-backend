const mongoose = require("mongoose");

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
 * @param socket A connected socket.io socket
 */
playerSchema.methods.joinRoom = async function (roomInstance) {
  console.log(`(${this.playerID})player.joinRoom: room = ${this.room}`);
  // A player can only join a room if they are not already in a room.
  if (this.room) {
    console.log(`Player ${this.playerID} is not in any room!`);
    return null;
  }

  // Add room to player instance.
  this.room = roomInstance;
  await this.save();
  return this;
};

/**
 * Leave and return any room instance that the `player` instance might be in and return null if not.
 * @param socket A connected socket.io socket
 */
playerSchema.methods.leaveRoom = async function () {
  // A player can only leave a room if they are already in a room.
  console.log(`(${this.playerID})player.leaveRoom: room = ${this.room}`);
  if (!this.room) {
    console.log(`Player ${this.playerID} is not in any room!`);
    return null;
  }
  // Remove room from player instance.
  const room = this.room;
  console.log({ "player.leaveRoom:room1": { room } });
  this.room = null;
  console.log({ "player.leaveRoom:room2": { room } });
  await this.save();
  return room;
};
module.exports = mongoose.model("Player", playerSchema);
