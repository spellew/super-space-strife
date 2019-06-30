window.addEventListener("load", () => {

  const socket = io();
  
  socket.once("config", ({ bounds, ratioW, ratioH }) => {
    window.game = new Game({ bounds, ratioW, ratioH });
  });

  class Game extends Phaser.Game {

    constructor({ bounds, ratioW, ratioH }) {

      let scale = null;
      let width = window.innerWidth;
      let height = window.innerHeight;

      if (width > height) {
        height = window.innerHeight * window.devicePixelRatio;
        width = height * ratioW / ratioH;
        scale = height / 1525;
      } else {
        width = window.innerWidth * window.devicePixelRatio;
        height = width * ratioH / ratioW;
        scale = height / 1525;
      }

      super({
        width,
        height,
        renderer: Phaser.AUTO,
        transparent: true,
        autoFocus: false,
      });

      this.map = {
        socket,
        self: null,
        players: null,
        meta: {
          width: width,
          height: height,
          bounds: bounds,
          scale: scale
        },
        debug: false
      };

      this.state.add("Boot", Boot);
      this.state.add("Menu", Menu);
      this.state.add("Loading", Loading);
      this.state.add("Playing", Playing);
      this.state.add("GameOver", GameOver);
      this.state.start("Boot", true, false, this.map);

    }

  }

});