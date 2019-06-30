const puppeteer = require('puppeteer');
const path = require("path");
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;


const config = require('./config');
const public = path.resolve(__dirname, "../src");
const port = config.port ? config.port : 3000;

const express = require('express');
const app = express();
app.use('/', express.static(public));
const server = app.listen(port);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const setDebug = function(bool) { window.game.state.callbackContext.map.debug = bool; };
const getCurrentState = function() { return window.game.state.current; };
const getPlayerPosition = function() { return window.game.state.callbackContext.map.player.sprite.position; };
const getPlayerAngularVelocity = function() { return window.game.state.callbackContext.map.player.sprite.body.angularVelocity; };
const getPlayerShotsFired = function() { return window.game.state.callbackContext.map.player.sprite.weapon.shots; };

const startPlayerAngularVelocityChange = function({ page, key }) {
  return new Promise(async (resolve) => {
    angularVelocity = await page.evaluate(getPlayerAngularVelocity);
    await page.keyboard.down(key);
    while(angularVelocity === await page.evaluate(getPlayerAngularVelocity)) {}
    resolve();
  });
};

const endPlayerAngularVelocityChange = async function({ page, key }) {
  return new Promise(async (resolve) => {
    angularVelocity = await page.evaluate(getPlayerAngularVelocity);
    await page.keyboard.up(key);
    while(angularVelocity === await page.evaluate(getPlayerAngularVelocity)) {}
    resolve();
  });
};

const changePlayerPosition = async function({ page, key }) {
  await page.keyboard.press(key, { delay: 750 });
  return await page.evaluate(getPlayerPosition);
};


describe("Tests the Phaser game and it's states.", function() {

  let gameLoaded = false;
  let browser = null;
  let state = null;
  let page = null;

  after(async function() {
    await browser.close();
    server.close();
  })

  it ("Can open browser?", function() {
    return new Promise(async (resolve) => {
      browser = await puppeteer.launch({ headless: config.headless ? config.headless : false });
      const pages = await browser.pages();
      page = pages[0];
      return resolve();
    });
  }).timeout(2500);

  for (let i = 0; i < (config.iterations ? config.iterations : 1); i++) {

    it("Can navigate to game?", function() {
      return new Promise(async (resolve) => {
        await page.goto(`http://localhost:${port}/`);
        return resolve();
      });
    }).timeout(1000);

    it("Is boot state the initial state?", function() {
      return new Promise(async (resolve) => {
        while (await page.evaluate(getCurrentState) === "") {}
        state = await page.evaluate(getCurrentState);
        gameLoaded = await page.evaluate(() => {
          let gameLoaded = false;
          window.game.load.onLoadComplete.add(() => {
            gameLoaded = true;
          });
          return new Promise((resolve) => {
            window.setInterval(() => {
              if (gameLoaded) resolve(gameLoaded);
            }, 50);
          });
        });
        expect(state).to.equal("Boot");
        resolve();
      })
        .catch(async (err) => assert.fail(err.message));
    }).timeout(10000);

    it("Is menu state navigated to after loading in?", function() {
      return new Promise(async (resolve) => {
        while(!gameLoaded) {}
        state = await page.evaluate(getCurrentState);
        expect(state).to.equal("Menu");
        resolve();
      })
        .catch(async (err) => assert.fail(err.message));
    }).timeout(1000);

    it("Can playing state be navigated to from loading?", function() {
      return new Promise(async (resolve) => {
        await delay(500);
        await page.click("canvas");
        await page.keyboard.press('Space');
        await delay(500);
        state = await page.evaluate(getCurrentState);
        expect(state).to.equal("Playing");
        resolve();
      })
        .catch(async (err) => assert.fail(err.message));
    }).timeout(2500);

    it("Can player be moved after keypress?", function() {
      return new Promise(async (resolve) => {
        
        await page.evaluate(setDebug, true);
        let originPosition = await page.evaluate(getPlayerPosition);
        let newPosition = { x: null, y: null };
        let angularVelocity = 0.0;

        newPosition = await changePlayerPosition({ page, key: "W" });
        expect(newPosition.y).to.be.below(originPosition.y);
        originPosition = newPosition;

        newPosition = await changePlayerPosition({ page, key: "S" });
        expect(newPosition.y).to.be.above(originPosition.y);
        originPosition = newPosition;

        await startPlayerAngularVelocityChange({ page, key: "A" });
        angularVelocity = await page.evaluate(getPlayerAngularVelocity);
        expect(angularVelocity).to.equal(-400);
        await endPlayerAngularVelocityChange({ page, key: "A" });

        await startPlayerAngularVelocityChange({ page, key: "D" });
        angularVelocity = await page.evaluate(getPlayerAngularVelocity);
        expect(angularVelocity).to.equal(400);
        await endPlayerAngularVelocityChange({ page, key: "D" });
        
        await page.evaluate(setDebug, false);
        resolve();

      })
        .catch(async (err) => assert.fail(err.message));
    }).timeout(4000);

    it("Can player fire shots after keypress?", function() {
      return new Promise(async (resolve) => {
        
        let shotsFired = null;

        shotsFired = await page.evaluate(getPlayerShotsFired);
        expect(shotsFired).to.equal(0);
        await page.keyboard.press("AltLeft", { delay: 750 });
        
        shotsFired = await page.evaluate(getPlayerShotsFired);
        expect(shotsFired).to.be.above(0);
        resolve();

      })
        .catch(async (err) => assert.fail(err.message));
    }).timeout(2000);

  }

});