class Menu extends Phaser.State {

  constructor() {
    super();
    
    this.loadGame = this.loadGame.bind(this);
  }

  init(map) { this.map = map }

  create() {

    this.game.add.tileSprite(0, 0, this.map.meta.width * this.map.meta.bounds, this.map.meta.height * this.map.meta.bounds, 'backdrop');

    this.text = this.game.add.text(this.map.meta.width * 0.5, this.map.meta.height * 0.5, "SUPER SPACE STRIFE", {
      font: "bold 92pt arial",
      fill: "#fff"
    });

    this.text2 = this.game.add.text(this.map.meta.width * 0.5, this.map.meta.height - 75, "Press ENTER or SPACEBAR to start;", {
      font: "32px Arial",
      fill: "#fff",
    });

    this.text.anchor.setTo(0.5, 0.5);
    this.text2.anchor.setTo(0.5, 0.5);

    this.loading = false;
    this.text.inputEnabled = true;
    this.text.events.onInputDown.add(this.loadGame, this.loadGame);

  }

  update() {

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.ENTER) || (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))) {
      this.loadGame();
    }
    
  }

  loadGame() {

    if (!this.loading) {

      this.loading = true;

      this.map.socket = io();
      this.map.socket.emit("join-game");
      this.map.socket.on("self-info", ({ id, x, y }) => {
        
        this.map.self = { id, x: Number(x), y: Number(y) };
        this.game.state.start("Loading", true, false, this.map);

      });

    }

  }

}