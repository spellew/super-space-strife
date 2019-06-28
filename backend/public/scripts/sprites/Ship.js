class Ship extends Phaser.Sprite {

  constructor({ id, x, y, health, game, map }) {

    const meta = map.meta;
    super(game, meta.width * meta.bounds * x, meta.height * meta.bounds * y, 'enemy');

    this.id = id;
    this.speed = 1250;
    this.anchor.setTo(0.5, 0.5);
    this.scale.set(0.55, 0.55);

    this.health = health || 100;
    this.maxHealth = 100;
    this.healthBar = new HealthBar(game, { width: 130, height: 12, bg: { color: '#fff' }, bar: { color: '#2ecc71' } });
    this.healthBar.setPercent(this.health / this.maxHealth * 100);


    this.weapon = game.add.weapon(30, 'enemy_bullet');
    this.weapon.fireRate = 50;
    this.weapon.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
    this.weapon.bulletLifespan = 750;
    this.weapon.bulletAngleOffset = 90;
    this.weapon.bulletSpeed = 2500;
    this.weapon.bulletWorldWrap = true;
    this.weapon.trackSprite(this, 0, 0);
    this.weapon.onFire.add(() => game.add.audio('laser1').play());

    game.physics.enable(this, Phaser.Physics.ARCADE);
    map.players.add(this);

  }
  
}