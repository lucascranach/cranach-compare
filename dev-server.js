const liveServer = require("live-server");

const params = {
	port: 8182, // Set the server port. Defaults to 8080.
	host: "localhost", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
	root: "public", // Set root directory that's being served. Defaults to cwd.
	open: false, // When false, it won't load your browser by default.
	file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
	logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
};

liveServer.start(params);