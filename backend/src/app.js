const express = require("express");
const path = require("path");
const app = express();
const app2 = express();
const server = require("http").Server(app);
const server2 = require("http").Server(app2);
const io = require("socket.io")(server);

// This points to the admin version of our game,
// which reacts to socket messages from the client.
const admin = path.join(__dirname, "../admin");
// This serves the public version of our game,
// which reacts to user controls and sends messages to the admin version.
const public = path.join(__dirname, "../public");
const port = 8080;
const headless = new Promise(async (resolve, reject) => {

  try {

    server.listen(port);
    server2.listen(port + 1);
    // Serves the game to users
    app.use("/", express.static(public));
    // Serves the game to itself, which it will then play
    app2.use("/", express.static(admin));

    const jsdom = require("jsdom");
    const { JSDOM } = jsdom;

    // This headless browser runs on the server to validate user actions
    const window = (await JSDOM.fromFile(admin + "/index.html", {
      url: "http://localhost:" + (port + 1),
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true
    })).window;
  
    const canvas = window["document"].createElement("CANVAS");
    const CanvasRenderingContext2D = canvas.getContext("2d");
  
    window["CanvasRenderingContext2D"] = CanvasRenderingContext2D;
    window["scrollTo"] = () => {};
    window["focus"] = () => {};
  
    const intervalId = setInterval(() => {
      if (window.document.readyState === 'complete') {
        clearInterval(intervalId);
        resolve(window);
      }
    }, 75);

  } catch(err) { reject(err); }
  
});

// This runs after our servers and headless browser has been setup.
headless
  .then((window) => {

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

  })
  .catch(err => console.error(err));
