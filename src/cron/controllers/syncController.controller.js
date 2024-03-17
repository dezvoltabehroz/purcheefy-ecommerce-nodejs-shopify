'use strict'

// Getting dependencies
const { isValidPhoneNumber, parsePhoneNumber } = require('libphonenumber-js');

// Getting Syncing Services
const { syncAbandonedCarts, updateTotalLineItemCount } = require('../services/syncing/abandonedCart.service');
const { syncProducts } = require('../services/syncing/productsSync.service');
const { updateShopperCountByCartId } = require('../controllers/shopper.controller');

// Query DB
const { query } = require("../dbLayer");
const { getCartsWithNegativeValue } = require("../dbLayer/db.queries");


// =============================================== Controllers ========================================================

// Sync Carts Controller
exports.syncCarts = async (req, res) => {
    const { checkJobsCron } = req.query;
    const checkJobs = checkJobsCron ? checkJobsCron : false;
    const resp = await syncAbandonedCarts(null, checkJobs);
    res.send(resp);
};

// Check phone validation
exports.validatePhoneNumber = async (req, res) => {
    const { phoneNumber, country_code } = req.params;
    const isValid = isValidPhoneNumber(phoneNumber, country_code);

    let parsedPhoneNumber = ''
    try {
        parsedPhoneNumber = parsePhoneNumber(phoneNumber, country_code);
    } catch (err) { }

    res.send({ [phoneNumber]: isValid, parsedPhoneNumber: parsedPhoneNumber.number });
};

// Update Carts Controller
exports.updateCarts = async (req, res) => {
    const { storeId, cartId, variant_id } = req.query;
    updateTotalLineItemCount(cartId, storeId, variant_id);
    res.send({ message: "Carts updating has been started" });
};

// Sync Products Controller
exports.syncProducts = async (req, res) => {
    const resp = await syncProducts();
    res.send(resp);
};

// Update Carts with Negative Value 
exports.updateNegativeCart = async () => {
    console.log("================ Update Carts with Negative Value ================")
    let cartsData = await query(getCartsWithNegativeValue(), [])
    if (cartsData.rows.length > 0)
        for (const cartData of cartsData.rows)
            updateTotalLineItemCount(cartData.cart_id, null)
}