"use strict";

// Getting dependencies
const format = require('pg-format');

const tableObj = require('../dbLayer/db.tables');

// database Queries
module.exports = {
    // Retrieves the record from the shopify_store_info table based on the email address
    checkIfEmail: () => `select * from ${tableObj.customers} where email = $1`,

    // Inserts the record into the shopify_store_info table
    signUpQuery: () => `insert into ${tableObj.customers} (username, password, email, currency) VALUES ($1, $2, $3, $4) returning id`,

    // Inserts the record into the shopify_store_info table
    notificationSettingsQuery: () => `insert into ${tableObj.notification_settings} (user_id) VALUES ($1)`,

    updateNotificationSettingQuery: () => `update ${tableObj.notification_settings} set 
        notify_of_checkouts = $1,
        notify_of_changes_in_cart = $2,
        notify_of_failed_payments = $3 
        where user_id = $4`,

    // Retrieves the record from the shopify_store_info table based on the email address
    signInQuery: () => `select ${tableObj.customers}.id from ${tableObj.customers} 
        inner join ${tableObj.notification_settings} on ${tableObj.customers}.id = ${tableObj.notification_settings}.user_id
        where email = $1 and password = $2`,

    // Retrieves the record from the shopify_store_info table based on the email address
    getUserDetailById: () => `select * from ${tableObj.customers} 
    inner join ${tableObj.notification_settings} on ${tableObj.customers}.id = ${tableObj.notification_settings}.user_id
    where ${tableObj.customers}.id = $1`,

    // Updates the password in the shopify_store_info table based on the email address
    updatePasswordAccrossEmail: () => `update ${tableObj.customers} set password = $1 where email = $2`,

    // Inserts the record into the shopify_store_info table
    connectStoreWithUser: () => `insert into ${tableObj.store_details} (store_type, store_credentials_details, customer_id) VALUES ($1, $2, $3)`

};
