import Phaser from "../lib/phaser.js";
import Avocado from "../game/Avocado.js";

const PLAYER_SPEED = 300;
const PLAYER_JUMP_SPEED = 900;

export default class Game extends Phaser.Scene {
  cursors;

  player;

  platforms;
  avocados;

  score;
  lastJumpPosition;

  splashParticles;

  constructor() {
    super("game");
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("platform", "assets/platform.png");
    this.load.image("avocado", "assets/avocado.png");
    this.load.image("particle-1", "assets/particle-1.png");

    this.load.audio("sploge-1", "assets/sploge-1.mp3");
    this.load.audio("sploge-2", "assets/sploge-2.mp3");
    this.load.audio("pop", "assets/pop.mp3");
    this.load.audio("music", "assets/music.wav");

    this.load.spritesheet("slime", "assets/slime_sprite.png", {
      frameWidth: 120,
      frameHeight: 105,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  init() {
    this.score = 0;
    this.lastJumpPosition = this.scale.height;
  }

  create() {
    if (!this.runOnce) {
      this.sound.play("music", {
        volume: 0.5,
        loop: true,
      });
      this.runOnce = true;
    }

    this.sky = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, "sky")
      .setOrigin(0)
      .setScrollFactor(1, 0);

    this.splashParticles = this.add.particles("particle-1");
    this.splashParticles.createEmitter({
      angle: { min: 180, max: 360 },
      speed: { min: 0, max: 200 },
      quantity: { min: 2, max: 5 },
      lifespan: 500,
      alpha: { start: 1, end: 0 },
      scale: { min: 0.5, max: 1.5 },
      gravityY: 400,
      on: false,
    });

    this.avocadoParticles = this.add.particles("avocado");
    this.avocadoParticles.createEmitter({
      angle: { min: 180, max: 360 },
      speed: { min: 0, max: 200 },
      quantity: { min: 50, max: 100 },
      lifespan: 2000,
      alpha: { start: 1, end: 0 },
      scale: { min: 0.1, max: 0.2 },
      gravityY: 400,
      on: false,
    });

    this.superAvocadoParticles = this.add.particles("avocado");
    this.superAvocadoParticles.createEmitter({
      angle: { min: 180, max: 360 },
      speed: { min: 0, max: 300 },
      quantity: { min: 100, max: 200 },
      lifespan: 2000,
      alpha: { start: 1, end: 0 },
      scale: { min: 0.1, max: 0.2 },
      gravityY: 400,
      tint: 0xff0000,
      on: false,
    });

    this.platforms = this.physics.add.staticGroup();
    for (let i = 0; i < 4; i++) {
      const x = this.scale.width / 2 + Phaser.Math.Between(-100, 100);
      const y = 150 * i;
      this.platforms
        .create(x, y, "platform")
        .setOrigin(0.5, 0.5)
        .setScale(0.5)
        .refreshBody();
    }

    this.avocados = this.physics.add.group({ classType: Avocado });

    this.player = this.physics.add
      .sprite(this.scale.width / 2, this.scale.height / 2, "slime")
      .setOrigin(0.5, 0.5);

    const jumpFrameRate = 10;
    this.anims.create({
      key: "pre-jump",
      frames: [
        { key: "slime", frame: 0 },
        { key: "slime", frame: 9 },
      ],
      frameRate: jumpFrameRate,
    });
    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("slime", { start: 0, end: 7 }),
      frameRate: jumpFrameRate,
    });

    this.player.on(
      "animationcomplete-pre-jump",
      function () {
        this.player.anims.play("jump");
        this.player.setVelocityY(-PLAYER_JUMP_SPEED);
        this.sound.play(`sploge-${Math.floor(Math.random() * 2) + 1}`, {
          detune: Phaser.Math.Between(-200, 200),
        });
      },
      this
    );

    const style = { color: "#000", fontSize: 24 };
    this.scoreText = this.add
      .text(10, 10, `Score: ${this.score}`, style)
      .setScrollFactor(0);

    if (localStorage.getItem("top-score") === null) {
      localStorage.setItem("top-score", 0);
    }
    this.topScoreText = this.add
      .text(10, 44, `Top Score: ${localStorage.getItem("top-score")}`, style)
      .setScrollFactor(0);

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setDeadzone(this.scale.width * 1.5);

    this.physics.add.collider(this.platforms, this.player);
    this.player.body.checkCollision.up = false;
    this.player.body.checkCollision.left = false;
    this.player.body.checkCollision.right = false;

    this.physics.add.collider(this.platforms, this.avocados);

    this.physics.add.overlap(
      this.player,
      this.avocados,
      this.handleCollectAvocado,
      undefined,
      this
    );
  }

  update() {
    const touchingDown = this.player.body.touching.down;
    if (touchingDown) {
      this.player.anims.play("pre-jump", true);
      this.lastJumpPosition = this.player.y;
      this.splashParticles.emitParticleAt(
        this.player.x,
        this.player.y + this.player.displayHeight / 2
      );
    }
    if (this.cursors.left.isDown && !touchingDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown && !touchingDown) {
      this.player.setVelocityX(PLAYER_SPEED);
    } else {
      this.player.setVelocityX(0);
    }
    if (this.player.x < 0) {
      this.player.x = this.scale.width;
    } else if (this.player.x > this.scale.width) {
      this.player.x = 0;
    }

    this.checkPlatforms();

    if (this.player.y > this.lastJumpPosition + this.scale.height / 2) {
      this.die();
    }

    this.sky.setTilePosition(0, this.cameras.main.scrollY);
  }

  checkPlatforms() {
    this.platforms.children.iterate((platform) => {
      const scrollY = this.cameras.main.scrollY;
      if (platform.y >= this.scale.height + scrollY) {
        platform.x = Phaser.Math.Clamp(
          platform.x + Phaser.Math.Between(-200, 200),
          platform.displayWidth,
          this.scale.width - platform.displayWidth
        );
        platform.y = scrollY - platform.displayHeight;
        platform.body.updateFromGameObject();
        const r = Math.random();
        if (r <= 0.01) {
          this.addAvocadoAbove(platform, Avocado.KIND.SUPER);
        } else if (r <= 0.1) {
          this.addAvocadoAbove(platform, Avocado.KIND.DEATH);
        } else if (r <= 0.5) {
          this.addAvocadoAbove(platform);
        }
      }
    });
  }

  addAvocadoAbove(sprite, kind = Avocado.KIND.REGULAR) {
    const y = sprite.y - sprite.displayHeight - 10; // Need this offset or avocado falls through platform
    const avocado = this.avocados.get(sprite.x, y, "avocado");
    avocado.setKind(kind);
    avocado.setActive(true);
    avocado.setVisible(true);
    this.add.existing(avocado);
    avocado.body.setSize(avocado.width, avocado.height);
    this.physics.world.enable(avocado);
    return avocado;
  }

  handleCollectAvocado(player, avocado) {
    this.sound.play("pop", {
      detune: Phaser.Math.Between(-500, 500),
    });
    this.avocados.killAndHide(avocado);
    this.physics.world.disableBody(avocado.body);
    let scoreIncrease = 1;
    switch (avocado.kind) {
      case Avocado.KIND.REGULAR: {
        this.avocadoParticles.emitParticleAt(avocado.x, avocado.y);
        break;
      }
      case Avocado.KIND.SUPER: {
        this.superAvocadoParticles.emitParticleAt(avocado.x, avocado.y);
        scoreIncrease = 50;
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            this.sound.play("pop", {
              detune: Phaser.Math.Between(-500, 500),
            });
          }, 20 * i);
        }
        break;
      }
      case Avocado.KIND.DEATH: {
        this.die();
        break;
      }
    }
    this.score += scoreIncrease;
    if (this.score > localStorage.getItem("top-score")) {
      localStorage.setItem("top-score", this.score);
      this.topScoreText.text = `Top Score: ${this.score}`;
    }
    this.scoreText.text = `Score: ${this.score}`;
  }

  die() {
    this.scene.start("game-over");
  }
}
