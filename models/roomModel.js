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

module.exports = mongoose.model("Room", roomSchema);
