'use strict';

// Getting dependencies

// Getting moment timezone
const moment = require('moment-timezone');

// Getting db queries
const queries = require("../../dbLayer/db.queries");

// Query DB
const { query } = require("../../dbLayer");

// Getting db tables
const tables = require("../../dbLayer/db.tables");

// Getting shopify Rest API promise
const { shopifyRestAPIPromise } = require('../shopify.service')

// Global Variable Declaration 
// var checkouts = [];

/**
 * Function to Upsert Abandoned Cart
 * @param    {String} storeId              Store Id
 * @param    {Object} abandonedCart        Abandoned Cart
 * @return   {Number}                      Returns row count after query process
 */
exports.upsertAbandonedCart = async (storeId, abandonedCart) => {
    try {
        const cartData = {
            store_id: storeId,
            cart_id: abandonedCart.id,
            token: `'${abandonedCart.token}'`,
            cart_token: `'${abandonedCart.cart_token}'`,
            data: `'${JSON.stringify(abandonedCart)}'`,
            created_at: `'${abandonedCart.created_at}'`,
            updated_at: `'${abandonedCart.updated_at}'`,
        }
        if (abandonedCart.completed_at) {
            cartData.completed_at = `'${abandonedCart.completed_at}'`
        }
        if (abandonedCart.closed_at) {
            cartData.closed_at = `'${abandonedCart.closed_at}'`
        }
        if (abandonedCart.deleted_at) {
            cartData.deleted_at = `'${abandonedCart.deleted_at}'`
        }

        try {
            const upsertAbandonedCartQuery = queries.upsertData(tables.abandoned_carts, cartData, 'store_id, cart_id');
            const res = await query(upsertAbandonedCartQuery);
            return res.rowCount
        } catch (exc) {

            console.log('exception in upsert cart query run', exc);
            return exc;
        }
    } catch (exception) {

        console.log('exception in upsert cart', exception);
        return false;
    }
}

/**
 * Function to Get Abandoned Carts
 * @param    {Object} store                Store
 * @param    {String} dateTime             DateTime
 * @return   {Array}                       Returns array of abandoned carts
 */
exports.getAbandonedCarts = async (store, dateTime = null, checkouts, prevDate = null, nextDate = null) => {
    try {
        const params1 = {
            method: 'get',
            url: '/checkouts.json?limit=250',
            shopName: store.shopify_store_name,
            accessToken: store.shopify_store_access_token
        }

        if (dateTime == null) {
            dateTime = moment().subtract(3, 'months').format('YYYY-MM-DD hh:mm:ss');
            prevDate = dateTime;
        }

        const params2 = { ...params1 };
        params2.url = `/checkouts.json?limit=250&updated_at_min=${dateTime}`
        console.log("URL Path : ", params2.url)

        let result = await shopifyRestAPIPromise(params2)
        let finalResult = checkouts;
        console.log("Result Data Count : ", result.data.checkouts.length)

        if (prevDate && nextDate && moment(prevDate).format('YYYY-MM-DD hh:mm:ss') == moment(nextDate).format('YYYY-MM-DD hh:mm:ss'))
            return finalResult;

        if (result && result.data.checkouts.length > 0) {
            checkouts = checkouts.concat(result.data.checkouts);
            finalResult = this.getAbandonedCarts(store, checkouts[checkouts.length - 1].updated_at, checkouts, dateTime, checkouts[checkouts.length - 1].updated_at)
        }

        return finalResult;
    } catch (exc) {
        console.log('exception to get abandoned carts', exc)
        return exc;
    }
}

