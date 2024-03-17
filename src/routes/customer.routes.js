'use strict'

// Getting dependencies

// Express
const express = require('express');

// Creating an express router
const router = express.Router();

// Middleware
const middleware = require('../middlewares');

// Validator
const validator = require('../validators/validations.js');

// Controller
const controller = require('../controllers/customer.controller');

// Routes
router.get('/health', middleware.pass, validator.health, controller.health);
router.post('/sign-up', middleware.pass, validator.health, controller.signUp);
router.post('/sign-in', middleware.pass, validator.health, controller.signIn);
router.put('/update-password', middleware.apiAuth, validator.health, controller.updatePassword);
router.post('/connect-store', middleware.apiAuth, validator.health, controller.connectStore);
router.put('/update-notification-setting', middleware.apiAuth, validator.health, controller.updateNotificationSetting);
router.put('/user-details', middleware.apiAuth, validator.health, controller.userDetails);
router.get('/refresh-token', middleware.refreshAuthToken, validator.health, controller.refreshToken);

module.exports = router;
