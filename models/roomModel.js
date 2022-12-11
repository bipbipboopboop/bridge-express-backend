const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roomSchema = new Schema(
  {
    roomID: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    readyPlayers: [{ type: Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true }
);

roomSchema.methods.addPlayer = async function (playerInstance) {
  console.log(
    `Adding player ${playerInstance.playerID} to room ${this.roomID}`
  );
  const numPlayerInRoom = this.players.length;
  const roomHasNoSpace = numPlayerInRoom >= 4;
  if (roomHasNoSpace) {
    throw `Room ${room.roomID} is full! Please try another room!`;
  }
  this.players.push(playerInstance);
  await this.save();
};

roomSchema.methods.removePlayer = async function (playerInstance) {
  console.log(`Removing player ${playerInstance} to room ${this}`);

  const newPlayers = this.players.filter(
    (plyr) => plyr.playerID !== this.playerID
  );
  this.players = newPlayers;
  await this.save();
};

roomSchema.methods.isEqual = function (roomInstance) {
  return this._id.equals(roomInstance._id);
};
module.exports = mongoose.model("Room", roomSchema);
