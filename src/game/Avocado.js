import Phaser from "../lib/phaser.js";

export default class Avocado extends Phaser.Physics.Arcade.Sprite {
  static KIND = {
    REGULAR: "REGULAR",
    SUPER: "SUPER",
    DEATH: "DEATH",
  };
  kind;

  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
  }

  setKind(kind) {
    this.kind = kind;
    switch (kind) {
      case Avocado.KIND.REGULAR:
        this.tint = undefined;
        break;
      case Avocado.KIND.SUPER:
        this.tint = 0xff0000;
        break;
      case Avocado.KIND.DEATH:
        this.tint = 0x000000;
        break;
    }
  }
}
