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

    this.text = this.game.add.text(this.map.meta.width * 0.5, this.map.meta.height - 75, "MOVE: WASD; SHOOT: SPACE;", {
      font: "32px Arial",
      fill: "#fff",
    });
    
    this.text.anchor.setTo(0.5, 0.5);
    this.text.fixedToCamera = true;

    window.newPlayer = ({ id }) => {

      const x = Math.random();
      const y = Math.random();

      return new Ship({
        id,
        x,
        y,
        game,
        map: this.map,
      });
      
    }

    window.turnPlayer = ({ id, angularVelocity }) => {
      const player = this.map.players.filter(i => i.id === id).first;
      player.body.angularVelocity = angularVelocity;
    }

    window.movePlayer = ({ id, backwards }) => {
      const player = this.map.players.filter(i => i.id === id).first;
      this.game.physics.arcade.velocityFromAngle(
        player.angle - 90,
        player.speed * (backwards ? -1 : 1),
        player.body.velocity
      );
    }

    window.fireBullets = ({ id }) => {
      const player = this.map.players.filter(i => i.id === id).first;
      player.weapon.fire();
    }
    
  }

  update() {

    this.map.players.forEach(player => {

      this.game.world.wrap(player, 0, true);

      player.body.velocity.x = 0;
      player.body.velocity.y = 0;
      player.body.angularVelocity = 0;

      player.weapon.fireAngle = player.angle - 90;
      player.healthBar.setPosition(player.x, player.y + 70);

      this.game.physics.arcade.overlap(player.weapon.bullets, this.map.players, (bullet, injured) => {
        if (player.id !== injured.id) {
          injured.health -= 10;
          injured.healthBar.setPercent(injured.health / injured.maxHealth * 100);
          if (window.damageTaken) window.damageTaken({ id: injured.id, bulletId: bullet.id });
          bullet.kill();

          if (injured.health <= 0) {
            injured.weapon.bullets.killAll();
            injured.healthBar.kill();
            injured.kill();
            if (window.playerDeath) window.playerDeath({ id: injured.id })
          }
        }
      });

      if (window.updatePlayers) window.updatePlayers();

    });

  }

}