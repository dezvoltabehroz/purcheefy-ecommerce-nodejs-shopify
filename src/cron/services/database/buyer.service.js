'use strict';

// Getting dependencies

// Getting db queries
const queries = require("../../dbLayer/db.queries");

// Query DB
const { query } = require("../../dbLayer");

// Getting db tables
const tables = require("../../dbLayer/db.tables");

/**
 * Function to Upsert Buyer
 * @param    {Object} buyerData         Buyer Data
 * @return   {Number}                   Returns row count after query process
 */
exports.upsertBuyer = async (buyerData) => {
    const upsertBuyerQuery = queries.upsertData(tables.zabooni_buyers, buyerData, 'store_id,email,abandoned_cart_id');
    const res = await query(upsertBuyerQuery);
    return res.rowCount
}

/**
 * Function to Check Buyer Existence
 * @param    {String} storeId           Store ID
 * @param    {String} email             Email
 * @param    {String} phone             Phone
 * @return   {Number}                   Returns row count after query process
 */
exports.isBuyerExist = async (storeId, email, phone) => {
    const getQuery = queries.getWhereQuery(tables.zabooni_buyers, `store_id = ${storeId} AND (email='${email}' OR email='${phone}')`, 'id, email, store_id');
    const res = await query(getQuery);
    return res.rowCount
}
