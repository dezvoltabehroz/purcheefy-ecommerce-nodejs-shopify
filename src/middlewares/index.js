'use strict'

// Getting dependencies

// Response middleware
const response = require('./response');

// API Middlewares
const { apiAuth, pass, cartSummaryAuth } = require('./apiAuth');

// Error handler middleware
const errorHandler = require('./errorHandler');

module.exports = {
    response,
    apiAuth,
    pass,
    errorHandler,
    cartSummaryAuth
};
