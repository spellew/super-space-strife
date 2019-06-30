module.exports = {
  setUp_phaserGame: (io, window) => {
    
    const players = {};
    const bounds = 1;

    window.startGame({ bounds });
    io.on("connection", (socket) => {

      const id = socket.id;

      socket.join("in-lobby");
      socket.emit("config", { bounds });

      socket.on("join-game", () => {

        socket.leave("in-lobby");
        socket.join("in-game");

        players[id] = window.newPlayer({ id });

        const { position, health } = players[id];
        const { x, y } = position;
        socket.emit("self-info", { id, x, y });

        socket.on("created-self", () => {
          socket.to("in-game").emit("player-join", { id, x, y, health });
          Object.keys(players).forEach(id => {
            if (id !== socket.id) {
              const { position, health } = players[id];
              const { x, y } = position;
              socket.emit("player-join", { id, x, y, health });
            }
          });
        });

        const angularVelocity = 400;
        socket.on("turn-left", () => window.turnPlayer({ id, angularVelocity: angularVelocity * -1 }));
        socket.on("turn-right", () => window.turnPlayer({ id, angularVelocity }));

        socket.on("move-forward", () => window.movePlayer({ id }));
        socket.on("move-backward", () => window.movePlayer({ id, backwards: true }));

        socket.on("fire-bullets", () => window.fireBullets({ id }));

      });

      socket.on('disconnect', () => {
        delete players[id];
        io.to("in-game").emit("player-disconnect", { id });
      });
    
    });

    window.updatePlayers = () => {
      
      const serialized = {};
      Object.keys(players).forEach((id) => {

        serialized[id] = {
          angle: players[id].angle,
          position: players[id].position,
          bullets: {}
        };

        const alive = players[id].weapon.bullets
          .filter((bullet) => bullet.alive).list;
        
        alive.forEach((bullet) => bullet.id = bullet.id ? 
          bullet.id : id + "-" + Math.random().toString(32).slice(2));

        alive.forEach((bullet) => {
          serialized[id].bullets[bullet.id] = {
            id: bullet.id,
            x: bullet.position.x,
            y: bullet.position.y,
            angle: bullet.angle
          };
        });

      });

      io.to("in-game").emit("update-game", {
        players: serialized,
      });

    };

    window.damageTaken = ({ id, bulletId }) => {
      io.to("in-game").emit("player-damage", { id, bulletId });
    }

    window.playerDeath = ({ id }) => {
      const socket = io.sockets.connected[id];
      io.to("in-game").emit("player-death", { id });
      delete players[id];
      if (socket) {
        socket.leave("in-game");
        socket.join("in-lobby");
      }
    }

  },
};