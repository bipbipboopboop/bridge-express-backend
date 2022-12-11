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

playerSchema.statics.findOneOrCreate = async function (condition) {
  const player = await this.findOne(condition);
  if (player) {
    return player;
  } else {
    return this.create(condition);
  }
};

/**
 * Leave and return any room instance that the `player` instance might be in and return null if not.
 * @param socket A connected socket.io socket
 */
playerSchema.methods.leaveRoom = async function () {
  // A player can only leave a room if they are already in a room.
  console.log(`${this.playerID}.leaveRoom: room = ${this.room}`);
  if (!this.room) {
    console.log(`Player ${this.playerID} is not in any room!`);
    return null;
  }
  // Remove room from player instance and remove player the `players` array of the room instance
  const room = this.room;
  console.log({ "player.leaveRoom:room1": { room } });
  this.room = null;
  console.log({ "player.leaveRoom:room2": { room } });
  await this.save();
  return room;
};
module.exports = mongoose.model("Player", playerSchema);
