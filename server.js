'use strict'

// Getting dependencies
const http = require('http');
const app = require('./src');

// Creating a server
const server = http.createServer(app);

// Initializing a server to listen on specified PORT
server.listen(process.env.PORT, () => console.log(`API running on ${process.env.NODE_ENV} Server:${process.env.PORT}`));
