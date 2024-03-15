'use strict'
//Getting dependencies
const jwt = require('jsonwebtoken');

// Getting environments
const { JWT_SECRET, TOKEN_CLIENT_ID, TOKEN_CLIENT_SECRET } = process.env;

// Getting verifyToken
const { verifyToken } = require('../utils/common');

// Authenticating API request
exports.apiAuth = async (req, res, next) => {
  if (!(req.headers && req.headers.authorization && req.headers.authorization.includes('Bearer '))) {
    return next({
      status: 401,
      message: "Auth Token Not Provided"
    });
  }

  const token = req.headers.authorization.replace('Bearer ', '');
  const decoded = jwt.verify(token, JWT_SECRET);
  
  req.userData = decoded;
  return next();
};

// Pass API request
exports.pass = (req, res, next) => { next() };

// Authenticating Cart Summary API request
exports.cartSummaryAuth = async (req, res, next) => {
  if (!(req.headers && req.headers.authorization && req.headers.authorization.includes('Bearer '))) {
    return next({
      status: 401,
      message: "Auth Token Not Provided"
    });
  }

  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  jwt.verify(token, TOKEN_CLIENT_SECRET, (err, decoded) => {
    if (err)
      next({ statusCode: 401, message: "The client is not allowed to access resources, and should re-request with the required credentials.", err })
    else
      decoded.client_id === TOKEN_CLIENT_ID
        ? next()
        : next({ statusCode: 401, message: "IDs Mismatch: The client is not allowed to access resources, and should re-request with the required credentials." })

  })
};