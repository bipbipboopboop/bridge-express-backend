const Room = require("../models/roomModel");
const Player = require("../models/playerModel");

module.exports = (io, socket) => {
  /**
   * Listens to a player's card play.
   * @param {string} suit Suit of the card, i.e `C`,`D`,`H`,`S`,`NT` for `Clubs`, `Diamonds`, `Hearts`, `Spades`, and `No Trump` respectively
   * @param {number} cardValue The value of the card. `A` is worth 14 points, `K` 13 points, `2` 2 points
   */
  const playCardFn = async function (suit, cardValue) {};
};
