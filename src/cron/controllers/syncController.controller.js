'use strict'

// Getting dependencies

// Getting Syncing Services
const { syncAbandonedCarts } = require('../services/syncing/abandonedCart.service');

// =============================================== Controllers ========================================================

// Sync Carts Controller
exports.syncCarts = async (req, res) => {
    const { checkJobsCron } = req.query;
    const checkJobs = checkJobsCron ? checkJobsCron : false;
    const resp = await syncAbandonedCarts(null, checkJobs);
    res.send(resp);
};