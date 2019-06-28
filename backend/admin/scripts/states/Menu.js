class Menu extends Phaser.State {

  constructor() {
    super();
    
    this.loadGame = this.loadGame.bind(this);
    this.loading = false;
  }

  init(map) { this.map = map }

  create() {
    const event = new CustomEvent("resize");
    window.dispatchEvent(event);
    this.loadGame();
  }

  loadGame() {
    this.game.state.start("Loading", true, false, this.map);
  }

}