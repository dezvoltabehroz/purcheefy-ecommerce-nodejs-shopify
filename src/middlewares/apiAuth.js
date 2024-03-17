'use strict'
//Getting dependencies
const jwt = require('jsonwebtoken');

// Getting environments
const { JWT_SECRET, REFRESH_TOKEN_SECRET } = process.env;

// Authenticating API request
exports.apiAuth = async (req, res, next) => {
  if (!(req.headers && req.headers.authorization && req.headers.authorization.includes('Bearer '))) {
    return next({
      status: 401,
      message: "Auth Token Not Provided"
    });
  }

  const token = req.headers.authorization.replace('Bearer ', '');
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return next({ status: 403, message: "Access token expired or invalid" });
    }
    req.userData = user;
    return next();
  });
};

// Authenticating Refresh token
exports.refreshAuthToken = async (req, res, next) => {
  if (!(req.headers && req.headers.authorization && req.headers.authorization.includes('Bearer '))) {
    return next({
      status: 401,
      message: "Auth Token Not Provided"
    });
  }

  const refresh_token = req.headers.authorization.replace('Bearer ', '');
  jwt.verify(refresh_token, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return next({ status: 403, message: "Access token expired or invalid" });
    }
    req.userData = user;
    return next();
  });
};

// Pass API request
exports.pass = (req, res, next) => { next() };