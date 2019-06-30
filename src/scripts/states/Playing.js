class Playing extends Phaser.State {

  constructor() {
    super();
  }

  init(map) { this.map = map }

  create() {

    this.paused = false;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.game.add.tileSprite(0, 0, this.map.meta.width * this.map.meta.bounds, this.map.meta.height * this.map.meta.bounds, 'backdrop');
    this.game.world.setBounds(0, 0, this.map.meta.width * this.map.meta.bounds, this.map.meta.height * this.map.meta.bounds);

    this.map.players = this.game.add.group();
    window.players = this.map.players;

    this.map.self.sprite = new Ship({
      id: this.map.self.id,
      x: this.map.self.x,
      y: this.map.self.y,
      game,
      map: this.map
    });

    game.camera.follow(this.map.self.sprite);

    this.zap = this.game.add.audio('zap', 4);
    this.text = this.game.add.text(this.map.meta.width * 0.5, this.map.meta.height - 75, "MOVE: WASD; SHOOT: SPACE;", {
      font: "32px Arial",
      fill: "#fff",
    });

    this.text.anchor.setTo(0.5, 0.5);
    this.text.fixedToCamera = true;

    this.map.socket.on("player-join", ({ id, x, y, health }) => {
      new Ship({ id, x, y, health, game, map: this.map });
    });

    this.map.socket.on("update-game", ({ players }) => {
      Object.keys(players).forEach((id) => {
        
        const player = this.map.players.filter(i => i.id === id).first;
        if (player) {

          player.position = players[id].position;
          player.angle = players[id].angle;
          if (players[id].bullets) {

            const keys = Object.keys(players[id].bullets);
            const available = keys;
            let n = 0;

            player.weapon.forEach(bullet => {

              n++;
              if (bullet.name) {
                available.splice(available.indexOf(bullet.name), 1);
              }

            });

            for (let i = 0; i < keys.length - n; i++) {

              player.weapon.fire();
              const head = available.splice(0, 1);
              const first = player.weapon.bullets
                .filter((bullet) => !bullet.name).first;
              
              if (first) first.name = head[0];

            };

            keys.forEach((bulletId) => {

              const { x, y, angle } = players[id].bullets[bulletId];
              const bullet = player.weapon.bullets
                .filter((bullet) => bullet.name === bulletId).first;

              if (bullet) {
                bullet.x = x;
                bullet.y = y;
                bullet.angle = angle;
              }

            });

          }

        }

      });
    });

    this.map.socket.on("player-disconnect", ({ id }) => {
      const player = this.map.players.filter(i => i.id === id).first;
      if (player) {
        player.weapon.bullets.killAll();
        player.healthBar.kill();
        player.kill();
      }
    });

    this.map.socket.on("player-damage", ({ id, bulletId }) => {
      const player = this.map.players.filter(i => i.id === id).first;
      if (player) {
        const first = player.weapon.bullets.filter(i => {
          // console.log(i.name);
          return i.name && i.name === bulletId;
        }).first;
        player.health -= 10;
        player.healthBar.setPercent(player.health / player.maxHealth * 100);
        // console.log(first);
        if (first) first.kill();
      }
    });

    this.map.socket.on("player-death", ({ id }) => {
      const player = this.map.players.filter(i => i.id === id).first;
      if (player) {
        player.weapon.bullets.killAll();
        player.healthBar.kill();
        player.kill();
        this.zap.play();
        if (id === this.map.self.id) {
          this.game.state.start("GameOver", true, false, this.map);
        }
      }
    });

    this.map.socket.emit("created-self");
    
  }

  update() {

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.map.socket.emit("turn-left");
    } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      this.map.socket.emit("turn-right");
    }

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      this.map.socket.emit("move-forward");
    } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.S)) {
      this.map.socket.emit("move-backward");
    }

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      this.map.socket.emit("fire-bullets");
    }

    this.map.players.forEach(player => {

      this.game.world.wrap(player, 0, true);

      player.body.velocity.x = 0;
      player.body.velocity.y = 0;
      player.body.angularVelocity = 0;

      player.weapon.fireAngle = player.angle - 90;
      player.healthBar.setPosition(player.x, player.y + 80);

    });

  }

}