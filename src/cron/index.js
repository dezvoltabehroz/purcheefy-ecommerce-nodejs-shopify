'use strict'

// Getting dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment-timezone');

const { healthCheckResponse } = require("./utils/common");
const syncController = require('./controllers/syncController.controller');
const cartSyncService = require('./services/syncing/abandonedCart.service');
const productsService = require('./services/syncing/productsSync.service');
const shopperController = require('./controllers/shopper.controller');

const cron = require('node-cron');

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
const bodyParserConfig = bodyParser.urlencoded({ extended: true });

// Getting dependency
const dotenv = require('dotenv');
dotenv.config();

// using middlewares
app.use(bodyParserConfig);
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get('/shopify/api/v1/health', (req, res, next) => res.send(healthCheckResponse));
app.get('/sync/abandonedCart', syncController.syncCarts);
app.get('/isValidNumber/:phoneNumber/:country_code', syncController.validatePhoneNumber);
app.get('/updateCarts', syncController.updateCarts);
app.get('/sync/products', syncController.syncProducts);

app.get('/update/shopper-count-cart-id', shopperController.updateShopperCountByCartId);
app.get('/update/shopper-count', (req, res, next) => {
    shopperController.updateShopperCount()
    res.send({ message: "Shopper Count updating has been started" });
});
app.get('/update/customer-id', (req, res, next) => {
    shopperController.updateCustomerIdInCart()
    res.send({ message: "Customer Id updating has been started" });
});


cron.schedule('*/20 * * * *', async () => {
    var startTime = moment().format('HH:mm:ss a');
    console.log('cron started...');
    const resp = await cartSyncService.syncAbandonedCarts();
    process.env.enable_log_detail == 1
        ? console.log('Cron res: ', resp)
        : console.log('Cron Executed Successfully')

    // Update Negaive carts
    syncController.updateNegativeCart();

    let isChangeFound = false
    for (const val of resp) {
        if (val.abandonedCartsCount || val.filteredCartsLength) {
            isChangeFound = true;
            break;
        }
    }
    // if (isChangeFound) cartSyncService.updateTotalLineItemCount();

    // Last Purchases count
    shopperController.updateCustomerIdInCart();

    var endTime = moment().format('HH:mm:ss a');
    console.log("Execution Time : ", moment.utc(moment(endTime, "HH:mm:ss").diff(moment(startTime, "HH:mm:ss"))).format("mm"))
});

cron.schedule('*/5 * * * *', async () => {
    console.log('Product Sync Started...');
    const resp = await productsService.syncProducts();
    process.env.enable_log_detail == 1
        ? console.log('Product Sync res: ', resp)
        : console.log('Product Sync Executed Successfully')
});

app.use(function (err, req, res, next) {
    console.log("====================== Error Before App Crashed ======================")
    console.log(err)
    console.log(err.status)
});

module.exports = app;
