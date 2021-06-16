import Phaser from "./lib/phaser.js";

import Game from "./scenes/Game.js";

import GameOver from "./scenes/GameOver.js";

export default new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [Game, GameOver],
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 1800,
      },
      // debug: true,
    },
  },
});
