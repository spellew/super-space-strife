class Loading extends Phaser.State {

  constructor() {
    super();

    this.startGame = this.startGame.bind(this);
  }

  init(map) { this.map = map }

  create() {

    this.game.load.onLoadStart.add(() => {});
    this.game.load.onFileComplete.add(() => {});
    this.game.load.onLoadComplete.add(this.startGame);

    this.game.load.image('enemy', './assets/playerShip1_red.png');
    this.game.load.image('enemy_bullet', './assets/lasers/laserRed03.png');

    this.game.load.start();

  }

  startGame() {
    this.game.state.start("Playing", true, false, this.map);
  }

}