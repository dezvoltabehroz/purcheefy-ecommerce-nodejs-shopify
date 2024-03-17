'use strict'

// Getting dependencies

// Query DB
const { query } = require('../dbLayer');

// Getting common health check response message
const { healthCheckResponse } = require('../utils/common');

// Getting shopify API promise
const { shopifyGraphqlAPIPromise } = require('../services/shopify.service');

// Getting shopify queries
const { } = require('../utils/shopify.queries');

// Getting response formatters
const { formatOrderDetailsData } = require('../formatters/order.formatters');

// =============================================== Controllers ========================================================

// Health check
exports.health = (req, res, next) => res.send(healthCheckResponse);
