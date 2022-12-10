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

playerSchema.statics.findOneOrCreate = async function findOneOrCreate(
  condition
) {
  const player = await this.findOne(condition);
  if (player) {
    return player;
  } else {
    return this.create(condition);
  }
};

module.exports = mongoose.model("Player", playerSchema);
