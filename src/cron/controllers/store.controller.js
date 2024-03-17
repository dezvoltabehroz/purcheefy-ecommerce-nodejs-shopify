"use strict";

// Getting dependencies

// Query DB
const { query } = require("../dbLayer");

// Getting db queries
const { getStoreInfoQuery } = require("../dbLayer/db.queries");

// Getting db tables
const { shopify_store_info } = require("../dbLayer/db.tables");

// =============================================== Controllers ========================================================

// ============================================= Helper Functions =====================================================

/**
 * Function that Get Store details from DB
 * @param    {String} storeId             Store ID
 * @return   {Object}                     Return a promise
 */
exports.getStoreDetailsFromDB = (storeId) => {
    const getStore = getStoreInfoQuery(shopify_store_info);

    return query(getStore, [storeId])
        .then(resp => resp)
        .catch(error => error.message);
};
