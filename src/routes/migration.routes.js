"use strict";

// Getting dependencies

// Express
const express = require("express");

// Creating an express router
const router = express.Router();

// Middleware
const middleware = require("../middlewares");

// Controller
const controller = require("../controllers/db.migration.controller");

// Routes
router.get("/migration/db", middleware.pass, controller.dbMigrations);
router.get("/migration/db/connection", middleware.pass, controller.checkConnection);

module.exports = router;
