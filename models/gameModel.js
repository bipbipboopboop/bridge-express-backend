const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gameSchema = new Schema(
  {
    // const room = {
    //   id: socket?.id,
    //   name: roomName,
    //   sockets: [],
    // };
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    defendingTeam: [{ type: Schema.Types.ObjectId, ref: "Room" }],
  },
  { timestamps: true }
);

// gameSchema.methods.addPlayer = function (playerInstance) {};

module.exports = mongoose.model("Game", gameSchema);
