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

const { enable_exception_log } = process.env;

/**
 * Function to Upsert Store Job
 * @param    {Object} store                Store details
 * @return   {Number}                      Returns row count after query process
 */
const upsertStoreJob = async (store) => {
    try {
        const storeId = store.shopify_store_id;
        const storeTimeZone = store.iana_timezone;
        const convertedDateTime = moment().tz(storeTimeZone).format();

        const jobData = {
            store_id: storeId,
            executed_at: `'${moment.utc(convertedDateTime).format()}'`
        };
        try {
            const upsertStoreJobQuery = queries.upsertData(tables.store_jobs, jobData, 'store_id');
            const res = await query(upsertStoreJobQuery);
            return res.rowCount
        } catch (exc) {
            if (enable_exception_log == 1)
                console.log('exception in upsert store job query run', exc);
            return exc;
        }
    } catch (exc) {
        if (enable_exception_log == 1)
            console.log('exc in upsert store job', exc)
    }
}

/**
 * Function to Get Job by Store Id
 * @param    {String} storeId              Store Id
 * @return   {Object}                      Returns response after query process
 */
const getJobByStoreId = async (storeId) => {
    try {
        const cartsCountQuery = queries.getWhereQuery(tables.store_jobs, `store_id='${storeId}'`);
        return await query(cartsCountQuery);
    } catch (exc) {
        if (enable_exception_log == 1)
            console.log('exception in creating store job', exc);
        return false;
    }
}

module.exports = {
    upsertStoreJob,
    getJobByStoreId,
}
