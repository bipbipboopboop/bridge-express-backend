const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roomSchema = new Schema(
  {
    // const room = {
    //   id: socket?.id,
    //   name: roomName,
    //   sockets: [],
    // };
    roomID: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true }
);

roomSchema.methods.addPlayer = function (playerInstance) {
  console.log(`Adding player ${playerInstance} to room ${this}`);
  const numPlayerInRoom = this.players.length;
  if (numPlayerInRoom >= 4) {
    throw `Room ${room.roomID} is full! Please try another room!`;
  }
  this.players.push(playerInstance);
  this.save();
};

roomSchema.methods.removePlayer = function (playerInstance) {
  console.log(`Removing player ${playerInstance} to room ${this}`);

  const newPlayers = this.players.filter((plyr) => plyr !== playerInstance);
  this.players = newPlayers;
  this.save();
};
module.exports = mongoose.model("Room", roomSchema);
