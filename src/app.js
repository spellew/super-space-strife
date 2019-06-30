const express = require("express");
const path = require("path");
const http = require("http");

const setUp_jsdomCanvas = require('./setup').setUp_jsdomCanvas;
const setUp_phaserGame = require('./play').setUp_phaserGame;


const setUp_publicInstance = (public, port) => {
  // This serves the public version of our game,
  // which sends input to the admin version for validation.
  const app = express();
  const server = http.Server(app);
  server.listen(port);

  // Serves the game to the public
  app.use("/", express.static(public));

  return server;
}


try {

  var site = null;
  const port = process.env.PORT || 3000;
  const domain = process.env.PROJECT_DOMAIN;
  const admin = path.join(__dirname, "../admin");
  const public = path.join(__dirname, "../public");


  if (domain) {
    site = `http://${domain}.glitch.me/`;
  } else {
    site = `http://localhost:${port}/`;
  }

  setUp_jsdomCanvas(site, admin)
    .then(window => {
      const publicServer = setUp_publicInstance(public, port);
      const io = require("socket.io")(publicServer);
      setUp_phaserGame(io, window);
    })
    .catch(err => console.error(err));

} catch(err) { console.error(err); }
