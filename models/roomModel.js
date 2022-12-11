const mongoose = require("mongoose");

const Schema = mongoose.Schema;

/**
 * Add a player instance into this room instance.
 * @param playerInstance An instance of the Player model.
 */
const addPlayer = async function (playerInstance) {
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

/**
 * Remove a player instance from this room instance.
 * @param playerInstance An instance of the Player model.
 */
const removePlayer = async function (playerInstance) {
  const thisRoom = await mongoose
    .model("Room")
    .findOne({ roomID: this.roomID })
    .populate("players");

  const updatedPlayers = thisRoom.players.filter(
    (plyr) => plyr.playerID !== playerInstance.playerID
  );
  this.players = updatedPlayers;
  await this.save();
};

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
  {
    methods: {
      addPlayer,
      removePlayer,
    },
  }
);

roomSchema.methods.isEqual = function (roomInstance) {
  return this._id.equals(roomInstance._id);
};
module.exports = mongoose.model("Room", roomSchema);
