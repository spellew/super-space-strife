class Boot extends Phaser.State {

  init(map) { this.map = map }

  create() {

    this.game.stage.disableVisibilityChange = true;
    this.game.load.onLoadStart.add(() => {});
    this.game.load.onFileComplete.add(() => {});
    this.game.load.onLoadComplete.add(() => {
      this.game.state.start("Menu", true, false, this.map);
    });

    this.game.load.image('backdrop', './assets/backgrounds/darkPurple.png');
    this.game.load.start();

  }

}