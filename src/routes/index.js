'use strict'

// Getting dependencies
const express = require('express');

// Creating index router
const indexRoutes = express.Router();

// Getting common health check response message
const { healthCheckResponse } = require('../utils/common');

// Getting Migration routes
const migrationRoutes = require('./migration.routes');

// Getting customer level routes
const customerRoutes = require('./customer.routes');

// Creating index level routes
indexRoutes.get('/health', (req, res, next) => res.reply(healthCheckResponse));

// Exporting all routes
module.exports = {
  indexRoutes,
  migrationRoutes,
  customerRoutes
};
