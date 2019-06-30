window.addEventListener("load", () => {

  const socket = io();
  const canvas = document.getElementsByTagName("canvas");
  
  socket.once("config", ({ bounds }) => {
    window.game = new Game({ bounds });
  });

  window.addEventListener("resize", () => {
    const scale = window.innerHeight / 800;
    canvas[0].style.transform = `scale(${scale}, ${scale})`;
  });

  class Game extends Phaser.Game {

    constructor({ bounds }) {

      const width = 800 * window.devicePixelRatio;
      const height = 800 * window.devicePixelRatio;

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