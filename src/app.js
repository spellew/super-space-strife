const express = require("express");
const path = require("path");
const http = require("http");
const httpProxy = require('http-proxy');

const setUp_jsdomCanvas = require('./setup').setUp_jsdomCanvas;
const setUp_phaserGame = require('./play').setUp_phaserGame;


const setUp_reverseProxy = (port) => {
  const app = express();
  const server = http.Server(app);
  const proxy = httpProxy.createProxyServer({});
  const localhosts = ['127.0.0.1', '::ffff:127.0.0.1', '::1'];

  server.listen(port);
  app.use(function(req, res) { // only localhost may visit admin server
    const ip = require('request-ip').getClientIp(req);
    console.log("New Request IP: " + ip);
    if (localhosts.includes(ip)) {
      proxy.web(req, res, { target: 'http://localhost:8080/' });
    } else {
      proxy.web(req, res, { target: 'http://localhost:8081/' });
    }
  });

  return server;
}


const setUp_adminInstance = (admin) => {
  // This serves the admin version of our game,
  // which receives messages from the client.
  const app = express();
  const server = http.Server(app);
  server.listen(8080);

  // Serves the game to itself
  app.use("/", express.static(admin));

  return server;
}


const setUp_publicInstance = (public) => {
  // This serves the public version of our game,
  // which sends input to the admin version for validation.
  const app = express();
  const server = http.Server(app);
  server.listen(8081);

  // Serves the game to the public
  app.use("/", express.static(public));

  return server;
}


try {

  var site = null;
  console.log("process.PORT", process.env.PORT);
  console.log("process.PROJECT_DOMAIN", process.env.PROJECT_DOMAIN);
  const port = process.env.PORT || 3000;
  const domain = process.env.PROJECT_DOMAIN;
  const admin = path.join(__dirname, "../admin");
  const public = path.join(__dirname, "../public");

  const proxyServer = setUp_reverseProxy(port);
  setUp_adminInstance(admin);

  if (domain) {
    site = `http://${domain}.glitch.me/`;
  } else {
    site = `http://localhost:${port}/`;
  }

  setUp_jsdomCanvas(site, admin)
    .then(window => {
      const io = require("socket.io")(proxyServer);
      setUp_phaserGame(io, window);
      setUp_publicInstance(public);
    })
    .catch(err => console.error(err));

} catch(err) { console.error(err); }
