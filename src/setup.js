const http = require("http");

module.exports = {
	setUp_jsdomCanvas: (site, admin) => {
		return new Promise(async (resolve, reject) => {

			try {
				const jsdom = require("jsdom");
				const { JSDOM } = jsdom;
	
				// This headless browser runs on the server to validate user actions
				const window = (await JSDOM.fromFile(admin + "/index.html", {
					url: "http://localhost:3000",
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
						// This line pings our server, so keeps stays alive (glitch.me).
						setInterval(() => {
							http.get(site);
						}, 280000);
						resolve(window);
					}
				}, 75);
	
			} catch(err) { reject(err); }
			
		});
	},
};