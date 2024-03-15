'use strict'

// Getting dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Middlewares
const { response, errorHandler } = require('./middlewares');

// Creating express app
const app = express();

// HTTP header Security
var helmet = require('helmet');
app.use(helmet());

// secure your various HTTP headers
app.use(helmet.contentSecurityPolicy());
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

// Body parser Configurations
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ limit: '15mb', extended: true }));

// Getting dependency
const dotenv = require('dotenv');
dotenv.config();

// using middlewares
app.use(response);
app.use(cors());
app.use(bodyParser.json());

// Getting all routes
const {
    indexRoutes,
    customerRoutes,
    migrationRoutes
} = require('./routes');

// Routes
app.use('/purcheefy/api/v1', indexRoutes);
app.use('/purcheefy', migrationRoutes);
app.use('/purcheefy/api/v1/customers', customerRoutes);

// catch 404 and forward to error handler
app.use((req, res) => { res.reply({ statusCode: 404 }) });
app.use(errorHandler);

app.use(function (err, req, res, next) {
    console.log("====================== Error Before App Crashed ======================")
    console.log(err)
    console.log(err.status)
});

module.exports = app;
