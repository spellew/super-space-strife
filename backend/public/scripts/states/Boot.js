class Boot extends Phaser.State {

  init(map) { this.map = map }

  create() {

    this.game.stage.disableVisibilityChange = true;
    this.game.load.onLoadStart.add(() => {});
    this.game.load.onFileComplete.add(() => {});
    this.game.load.onLoadComplete.add(() => {

      if (!this.game.backgroundFx) {

        this.game.backgroundFx = this.game.add.audio('space', 1, true);
        this.game.backgroundFx.allowMultiple = false;
        this.game.backgroundFx.onDecoded.add(() => {

          this.game.backgroundFx.fadeIn(2000, true);

        });
    
        this.map.backgroundFx = this.game.backgroundFx;
        this.game.state.start("Menu", true, false, this.map);

      }

    });

    this.game.load.image('backdrop', './assets/backgrounds/darkPurple.png');
    this.game.load.audio('space', './assets/bonus/sfx_throughSpace.ogg');

    this.game.load.start();

  }

}