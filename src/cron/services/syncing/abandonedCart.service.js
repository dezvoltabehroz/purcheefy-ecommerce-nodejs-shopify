'use strict';

// Getting dependencies
const { isValidPhoneNumber, parsePhoneNumber } = require('libphonenumber-js');

// Getting cart services
const cartService = require('../database/cart.service');

// Getting store job services
const storeJobService = require('../database/storeJobs.service');

// Getting db queries
const { selectAllQuery, getWhereQuery, upsertCart, upsertCartBackup, getCartsWithDraftOrderIdAcrossStore } = require("../../dbLayer/db.queries");

// Query DB
const { query } = require("../../dbLayer");

// Getting db tables
const tables = require("../../dbLayer/db.tables");

// Getting moment timezone
const moment = require('moment-timezone');

// Getting zbooni buyer services
const zabooniBuyerService = require("../zabooni/zaboonBuyer.service");

// Getting DB buyer services
const dbBuyerService = require("../database/buyer.service");

// Getting Auth Services
const authService = require("../zabooni/auth.service");

// Getting Firebase events controller
const firebaseEventController = require("../../controllers/firebaseEvent.controller");

// Getting Store controller
const storeController = require('../../controllers/store.controller');

// Getting Store controller
const productController = require('../../controllers/product.controller');

// Getting formatters
const { formatResponseForDB, formatLineItem } = require("../../formatters/cart.formatters");
const axios = require("axios");

const { enable_log_detail, enable_exception_log } = process.env;

let zbooniUsername = "", zbooniPassword = "";

/**
 * Function to Sync Abandoned Carts
 * @return   {Object}                      Sync Abandoned Carts
 */
exports.syncAbandonedCarts = async (lastExecutedTime = null, checkJobs = true) => {
    const responseObject = [];
    try {
        const stores = await getStores();
        if (stores.rowCount) {
            for (const store of stores.rows) {
                if (store.is_product_sync_completed == true) {
                    lastExecutedTime = null;
                    if (checkJobs) {
                        const storeJobRes = await storeJobService.getJobByStoreId(store.shopify_store_id)
                        if (storeJobRes.rowCount) {
                            lastExecutedTime = moment(storeJobRes.rows[0].executed_at).format(); // i.e 2022-04-23T13:27:52+05:00
                        }
                    }

                    await cartService.getAbandonedCarts(store, lastExecutedTime, [])
                        .then(async abandonedCarts => {
                            try {
                                if (abandonedCarts && abandonedCarts.length) {
                                    const storeId = store.shopify_store_id
                                    const cartArray = [];
                                    let accessToken = null;

                                    await storeController.getStoreDetailsFromDB(storeId)
                                        .then(async response => {
                                            if (response.rowCount > 0) {
                                                const { zbooni_username, zbooni_password } = response.rows[0];
                                                zbooniUsername = zbooni_username;
                                                zbooniPassword = zbooni_password;

                                                const customer = await authService.login(zbooni_username, zbooni_password);
                                                if (customer)
                                                    accessToken = customer.access_token;
                                            } else console.log(`No Store found against this storeID: ${storeId}`);
                                        }).catch(error => {
                                            if (enable_log_detail == 1 && enable_exception_log == 1)
                                                console.log('ERROR: getStoreDetailsFromDB: ', { storeId, error: error.response.data })
                                            else if (enable_log_detail == 0 && enable_exception_log == 1)
                                                console.log(`ERROR: getStoreDetailsFromDB for Store ID : ${store.shopify_store_id} and Store Name : ${store.shopify_store_name}`)
                                        });

                                    for (const abandonedCart of abandonedCarts) {
                                        if (abandonedCart['shipping_address'] && abandonedCart['shipping_address'].phone) {
                                            let formatPhone = abandonedCart['shipping_address'].phone.replace(/ /g, '');
                                            if (formatPhone.startsWith('00'))
                                                formatPhone = formatPhone.replace(/^.{2}/g, '');

                                            if (!formatPhone.startsWith('00') && !formatPhone.startsWith('0') && formatPhone.indexOf('+') === -1)
                                                formatPhone = `${formatPhone}`;

                                            abandonedCart['shipping_address'].phone = formatPhone;

                                            try {
                                                let parsedPhoneNumber = parsePhoneNumber(abandonedCart['shipping_address'].phone, abandonedCart['shipping_address']?.country_code ? abandonedCart['shipping_address']?.country_code : 'AE');
                                                abandonedCart['shipping_address'].phone = parsedPhoneNumber.number
                                            } catch (err) { }

                                            let isBuyerAccept = true;
                                            if (store.subscribe_marketing)
                                                isBuyerAccept = abandonedCart['buyer_accepts_marketing'];

                                            if (isBuyerAccept &&
                                                abandonedCart['shipping_address'].phone &&
                                                isValidPhoneNumber(abandonedCart['shipping_address'].phone, abandonedCart['shipping_address'].country_code) &&
                                                store?.currency == abandonedCart?.presentment_currency) {

                                                if (abandonedCart?.shipping_lines?.length == 0) {
                                                    abandonedCart.shipping_lines = [
                                                        {
                                                            "code": "",
                                                            "phone": null,
                                                            "price": 0,
                                                            "title": "Free",
                                                            "markup": 0,
                                                            "source": "",
                                                            "tax_lines": [
                                                                {
                                                                    "rate": 0,
                                                                    "zone": null,
                                                                    "price": 0,
                                                                    "title": "Free",
                                                                    "source": null,
                                                                    "position": 0,
                                                                    "compare_at": 0,
                                                                    "identifier": null,
                                                                    "channel_liable": false
                                                                }
                                                            ],
                                                            "api_client_id": 123456,
                                                            "presentment_title": "",
                                                            "carrier_identifier": null,
                                                            "carrier_service_id": null,
                                                            "validation_context": null,
                                                            "delivery_option_group": {
                                                                "type": "",
                                                                "token": ""
                                                            },
                                                            "shipping_original_price": 0,
                                                            "delivery_expectation_type": null,
                                                            "delivery_expectation_range": null
                                                        }
                                                    ]
                                                }

                                                // ======== Customer Name Checking - Start ========
                                                if ((abandonedCart['customer']?.first_name == null && abandonedCart['customer']?.last_name == null) ||
                                                    (abandonedCart['customer']?.first_name == "" && abandonedCart['customer']?.last_name == "")) {
                                                    if ((abandonedCart['billing_address']?.first_name == null && abandonedCart['billing_address']?.last_name == null) ||
                                                        (abandonedCart['billing_address']?.first_name == "" && abandonedCart['billing_address']?.last_name == "")) {
                                                        if ((abandonedCart['shipping_address']?.first_name == null && abandonedCart['shipping_address']?.last_name == null) ||
                                                            (abandonedCart['shipping_address']?.first_name == "" && abandonedCart['shipping_address']?.last_name == "")) {
                                                            abandonedCart['customer'].first_name = '-';
                                                            abandonedCart['customer'].last_name = '-';
                                                        } else {
                                                            abandonedCart['customer'].first_name = abandonedCart['shipping_address']?.first_name || ' ';
                                                            abandonedCart['customer'].last_name = abandonedCart['shipping_address']?.last_name || ' ';
                                                        }
                                                    } else {
                                                        if (abandonedCart?.customer) {
                                                            abandonedCart['customer'].first_name = abandonedCart['billing_address']?.first_name || ' ';
                                                            abandonedCart['customer'].last_name = abandonedCart['billing_address']?.last_name || ' ';
                                                        } else {
                                                            abandonedCart.customer = abandonedCart['billing_address']
                                                        }
                                                    }
                                                }

                                                if (abandonedCart['customer']?.last_name == null) abandonedCart['customer'].last_name = ' ';
                                                if (abandonedCart['customer']?.first_name == null) abandonedCart['customer'].first_name = ' ';
                                                // ======== Customer Name Checking - End ========


                                                totalLineItemCount(abandonedCart);
                                                // createBuyer({ abandonedCart, accessToken, store });

                                                abandonedCart['total_price'] = parseFloat(abandonedCart['total_line_items_price']);
                                                const newLineItems = [];
                                                for (let lineItem of abandonedCart.line_items) {
                                                    await getProductDetails(lineItem, storeId)
                                                        .then(async product => {

                                                            if (product.outOfStock) {
                                                                abandonedCart.total_line_count = abandonedCart.total_line_count - lineItem.quantity;

                                                                let new_total_price = (abandonedCart['total_price'] - (lineItem.quantity * lineItem.price)).toFixed(2);
                                                                abandonedCart['total_price'] = new_total_price < 0 ? 0 : new_total_price
                                                            }

                                                            newLineItems.push(formatLineItem(lineItem, product, product.outOfStock, product.stock_count, product.tracksInventory, product.inventoryPolicy, product.selectedOptions))
                                                        })
                                                        .catch(error => {
                                                            if (enable_exception_log == 1)
                                                                console.log('ERROR: getProductDetails: ', error)
                                                        })
                                                }
                                                abandonedCart.cart_price = 0;
                                                let shipping_price = parseFloat(abandonedCart?.shipping_lines[0]?.price);
                                                abandonedCart.shipping_lines[0].shipping_original_price = shipping_price

                                                if (parseFloat(abandonedCart['total_price']) !== 0)
                                                    abandonedCart['total_price'] = parseFloat(abandonedCart['total_price'])
                                                // abandonedCart['total_price'] = parseFloat(abandonedCart['total_price']) + parseFloat(abandonedCart?.shipping_lines[0]?.price)

                                                if (newLineItems.length == 0) {
                                                    abandonedCart['total_price'] = 0
                                                    abandonedCart['total_line_count'] = 0
                                                }
                                                abandonedCart.line_items = newLineItems;
                                                abandonedCart.zbooniTax = null;

                                                // ABANDONED_CARTS => EVENT
                                                firebaseEventController.saveFirebaseEvents(moment.utc().format("Y-MM-DD HH:mm:ss"), 'ABANDONED_CARTS', abandonedCart['total_price'])
                                                    .then(resp => {
                                                        if (enable_log_detail == 1)
                                                            console.log('RESPONSE: ABANDONED_CARTS: Events: ', { rowCount: resp.rowCount })
                                                    })
                                                    .catch(error => {
                                                        if (enable_exception_log == 1)
                                                            console.log('ERROR: ABANDONED_CARTS: Events: ', { error: error.message })
                                                    });

                                                if (cartArray.filter(cartArray => cartArray.includes(abandonedCart.id)).length == 0)
                                                    cartArray.push(formatResponseForDB({ storeId, abandonedCart }))
                                            } else {
                                                if (enable_log_detail == 1)
                                                    console.log("=========> Not a Valid Number : ", abandonedCart['shipping_address'].phone)
                                            }
                                        }
                                    }
                                    cartArray.length && upsertAbandonedInDb(cartArray);
                                    responseObject.push({ success: true, message: 'Abandoned carts inserted/updated successfully', store, abandonedCartsCount: abandonedCarts.length, filteredCartsLength: cartArray.length })
                                } else {
                                    console.log('carts not found in shopify');
                                    responseObject.push({ success: false, message: 'Abandoned carts not found in shopify', store })
                                }
                            } catch (exception) {
                                if (enable_exception_log == 1)
                                    console.log('exception in upserting abandoned carts', exception)
                                responseObject.push({ success: false, message: 'exception in upserting abandoned carts', store })
                            }
                        }).catch(error => {
                            if (enable_exception_log == 1)
                                console.log('exception in getting shopify checkouts', error.message)
                            responseObject.push({ success: false, message: 'exception in getting shopify checkouts', store })
                        });
                    storeJobService.upsertStoreJob(store);
                }
            }
        } else {
            responseObject.push({ success: false, message: 'Stores not found in db.' })
        }
    } catch (exception) {
        if (enable_exception_log == 1)
            console.log('exception found', exception);
        responseObject.push({ success: false, message: 'Exception found', exception })
    }
    return responseObject
};

/**
 * Function to Get Stores
 * @return   {Object}                      Returns store after query process
 */
const getStores = async () => {
    const getStore = selectAllQuery(tables.shopify_store_info);
    return await query(getStore);
};

/**
 * Function to Get Product Details
 * @param    {Object} lineItem             Line Item
 * @param    {String} storeId              Store Id
 * @return   {Object}                      Returns product details after query process
 */
const getProductDetails = async (lineItem, storeId) => {
    try {
        if (lineItem["variant_id"]) {
            const getAsset = getWhereQuery(tables.products, `
                shopify_store_id='${storeId}' AND shopify_product_id='${lineItem["product_id"]}' AND shopify_variant_id='${lineItem["variant_id"]}'
            `);

            const queryData = await query(getAsset);

            return queryData.rows[0] ? {
                uuid: queryData.rows[0]['id'],
                zbooni_product_id: queryData.rows[0]['zbooni_product_id'],
                assets: queryData.rows[0]['zbooni_product_details']['data']['assets'],
                is_active: queryData.rows[0]['zbooni_product_details']['data']['is_active'],
                outOfStock: queryData.rows[0]['zbooni_product_details']['data']['outOfStock'],
                price_value: queryData.rows[0]['zbooni_product_details']['data']['price_value'],
                stock_count: queryData.rows[0]['zbooni_product_details']['data']['stock_count'],
                inventoryPolicy: queryData.rows[0]['zbooni_product_details']['data']['inventoryPolicy'],
                tracksInventory: queryData.rows[0]['zbooni_product_details']['data']['tracksInventory'],
                selectedOptions: queryData.rows[0]['zbooni_product_details']['data']['selectedOptions']
            } : [];
        }
    } catch (exception) {
        if (enable_exception_log == 1)
            console.log('exception in getProductDetails', exception)
    }
};

/**
 * Function to Upsert Abandoned Cart In DB
 * @param    {Object} values               Values
 * @return   {log}                         Returns row count after query process
 */
const upsertAbandonedInDb = (values) => {
    let upsertCartQuery = upsertCart(tables.abandoned_carts, values);
    let upsertCartBackupQuery = upsertCartBackup(tables.abandoned_carts_backup, values);
    upsertCartQuery = upsertCartQuery.replace(`\\" `, ` `)
    upsertCartBackupQuery = upsertCartBackupQuery.replace(`\\" `, ` `)

    query(upsertCartQuery)
        .then((resp) => {
            const storeId = values[0][0];
            const newCartsCount = values.length;

            sendPushNotificationForNewCarts({ storeId, newCartsCount })

            if (enable_log_detail == 1)
                console.log('RESPONSE: CART ADD || rowCount ', resp.rowCount)
        })
        .catch((error) => {
            if (enable_exception_log == 1)
                console.log('ERROR: upsertAbandonedInDb: CART ADD: ', error)
        });

    query(upsertCartBackupQuery)
        .then((resp) => {
            if (enable_log_detail == 1)
                console.log('RESPONSE: CART BACKUP ADD || rowCount ', resp.rowCount)
        })
        .catch((error) => {
            if (enable_exception_log == 1)
                console.log('ERROR: upsertAbandonedInDb: CART BACKUP ADD: ', error)
        });
};

const sendPushNotificationForNewCarts = ({ storeId, newCartsCount }) => {
    const url = `${process.env.CCART_API_BASE}/notifications/store/${storeId}`;
    const notificationBody = {
        cartId: '0',
        category: 'Cart',
        status: 'new',
        newCartsCount
    }

    axios.post(url, notificationBody)
        .then(notificationResp => {
            console.log("RESPONSE: sendPushNotificationForNewCarts: ", notificationResp.data);
        })
        .catch(error => {
            if (enable_log_detail == 1)
                console.log(`ERROR: sendPushNotificationForNewCarts: /acb/api/v1/notifications/store/${storeId} => `, error.message)
        });
}

/**
 * Function to Create Buyer
 * @param    {Object} abandonedCart        Abandoned Cart
 * @param    {String} accessToken          Access Token
 * @param    {Object} store                Store
 * @return   {Object}                      Returns success and data object
 */
const createBuyer = ({ abandonedCart, accessToken, store }) => {
    const buyerPhoneNumber = abandonedCart['shipping_address'].phone;
    dbBuyerService.isBuyerExist(store.shopify_store_id, abandonedCart.email, buyerPhoneNumber)
        .then(async isBuyer => {
            if (!isBuyer) {
                //create zabooni & DB buyer
                const customer = {
                    first_name: abandonedCart.customer.first_name,
                    last_name: abandonedCart.customer.last_name,
                    addresses: [
                        {
                            street_1: abandonedCart.customer.default_address.address1,
                            city: abandonedCart.customer.default_address.city,
                            country:
                            {
                                code: abandonedCart.customer.default_address.country_code,
                                name: abandonedCart.customer.default_address.country_name
                            }
                        }
                    ]
                };
                if (buyerPhoneNumber) {
                    customer.phone_numbers = [
                        { phone_number: buyerPhoneNumber }
                    ]
                }
                if (abandonedCart.email) {
                    customer.email_addresses = [
                        { address: abandonedCart.email }
                    ]
                }
                zabooniBuyerService.createBuyer(store.shopify_store_id, accessToken, customer, abandonedCart.id)
                    .then(buyerResponse => {
                        if (buyerResponse.success) {
                            if (enable_log_detail == 1) {
                                console.log('RESPONSE: Buyer created successfully in zabooni: ', { store, abandonedCartId: abandonedCart?.id, customerId: abandonedCart?.customer?.id, buyerResponse })
                                console.log(`RESPONSE: Buyer created successfully in zabooni for Store ID : ${store.shopify_store_id} and Store Name : ${store.shopify_store_name}`)
                            }
                        } else {
                            if (enable_log_detail == 1) {
                                console.log('Error to create buyer in zabooni: ', { store, abandonedCartId: abandonedCart?.id, customerId: abandonedCart?.customer?.id, isBuyer, buyerResponse })
                                console.log(`Error to create buyer in zabooni for Store ID : ${store.shopify_store_id} and Store Name : ${store.shopify_store_name}`)
                            }
                        }
                    })
                    .catch(exc => {
                        console.log('Exception to create buyer in zabooni: ', exc.message)
                    });
            } else {
                // buyer exist
                if (enable_log_detail == 1) {
                    console.log('Buyer Exist....', { store, abandonedCartId: abandonedCart?.id, customerId: abandonedCart?.customer?.id })
                    console.log(`Buyer Exist for Store ID : ${store.shopify_store_id} and Store Name : ${store.shopify_store_name}`)
                }
            }
        })
        .catch(exc => {
            if (enable_exception_log == 1)
                console.log('ERROR: Create Buyer: ', exc.message)
        })
};

/**
 * Function to Get Total Line Item Count
 * @param    {Object} abandonedCart        Abandoned Cart
 * @return   {Object}                      Returns Object with Total Line Item Count
 */
const totalLineItemCount = (abandonedCart) => {
    if (abandonedCart.line_items.length > 0) {
        let total_line_count = 0;
        abandonedCart.line_items.forEach((product, index) => {
            total_line_count = total_line_count + Number(product.quantity)

            if (abandonedCart.line_items.length == (index + 1))
                abandonedCart["total_line_count"] = total_line_count;
        })
    } else {
        abandonedCart["total_line_count"] = abandonedCart.line_items.length;
    }
};

/**
 * Function to Update Total Line Item Count
 */
exports.updateTotalLineItemCount = async (cartId = null, storeId = null, variant_id = []) => {
    let queryStr = ``;

    if (cartId)
        queryStr = `select cart_id,store_id, total_line_count,data::jsonb from  ${tables.abandoned_carts} where status in ('active','new','archived') and cart_id = '${cartId}' order by created_at desc`
    else if (storeId)
        queryStr = `select cart_id,store_id, total_line_count,data::jsonb from  ${tables.abandoned_carts} where status in ('active','new','archived') and store_id = '${storeId}' order by created_at desc`
    else
        queryStr = `select cart_id,store_id, total_line_count,data::jsonb from  ${tables.abandoned_carts} where status in ('active','new','archived') order by created_at desc`

    query(queryStr, [])
        .then(async resCartData => {
            for (let [i, abandonedCartObj] of resCartData.rows.entries()) {
                query(`select cart_id,store_id, total_line_count,data::jsonb from  ${tables.abandoned_carts} where cart_id = $1`, [abandonedCartObj.cart_id])
                    .then(async resAbcCart => {
                        let is_item_found = false;
                        let abandonedCart = resAbcCart.rows[0]

                        if (variant_id.length > 0) {
                            let filterArr = abandonedCart?.data?.line_items.filter(variant => variant_id.includes(variant.variant_id))
                            is_item_found = filterArr.length > 0 ? true : false;
                        }
                        else is_item_found = true

                        if (is_item_found) {
                            await sleep(500)
                            console.log(`Line Items and price of Cart Update ${i + 1}/${resCartData.rows.length}`)
                            let cartId = abandonedCart.cart_id;
                            let storeId = abandonedCart.store_id;
                            let total_line_count = 0;
                            let total_discount_price = 0;
                            let sub_total = 0
                            let newLineItems = [];

                            if (abandonedCart.data.line_items.length > 0) {
                                for (let [index, lineItem] of abandonedCart.data.line_items.entries()) {
                                    await getProductDetails2(lineItem, storeId)
                                        .then(async product => {
                                            if (product?.name) {

                                                let isOutOfStock = ''
                                                if (product?.tracksInventory)
                                                    if ((product?.inventoryPolicy == 'DENY' || product?.inventoryPolicy == 'deny') && product?.stock_count <= 0) isOutOfStock = true
                                                    else isOutOfStock = false
                                                else isOutOfStock = false

                                                lineItem.price = product?.price_value || 0;
                                                let formattedLineItems = await formatLineItem(
                                                    lineItem,
                                                    product,
                                                    isOutOfStock,
                                                    product?.stock_count || 0,
                                                    product?.tracksInventory,
                                                    product?.inventoryPolicy,
                                                    product?.selectedOptions
                                                )
                                                formattedLineItems['title'] = product?.name || '';

                                                if (product?.is_deleted === false) {
                                                    newLineItems.push(formattedLineItems)

                                                    if (!isOutOfStock)
                                                        total_line_count = total_line_count + Number(lineItem.quantity)

                                                    let isStockValue = '';
                                                    if (formattedLineItems?.tracksInventory)
                                                        (formattedLineItems.stock_count < formattedLineItems.quantity && (formattedLineItems?.inventoryPolicy == 'DENY' || formattedLineItems?.inventoryPolicy == 'deny'))
                                                            ? isStockValue = true
                                                            : isStockValue = false
                                                    else isStockValue = false

                                                    if (isOutOfStock == false) {
                                                        if (formattedLineItems.discountedPrice) {
                                                            total_discount_price = total_discount_price + parseFloat(formattedLineItems.discountedPrice * formattedLineItems.quantity)
                                                        } else {
                                                            sub_total = sub_total + parseFloat(formattedLineItems.price * formattedLineItems.quantity)
                                                        }
                                                    }
                                                }

                                                if (abandonedCart.data.line_items.length == (index + 1)) {
                                                    let new_total_price = parseFloat(sub_total) + parseFloat(total_discount_price)
                                                    let cart_price = new_total_price > 0 ? new_total_price + parseFloat(abandonedCart.data.shipping_lines[0].price) : 0;
                                                    let totalCount = newLineItems.length > 0 ? total_line_count : 0;

                                                    if (JSON.stringify(abandonedCart.data.line_items) != JSON.stringify(newLineItems)) {
                                                        await sleep(10)

                                                        // ============================= Formatting =============================
                                                        let lineItem = JSON.stringify(newLineItems)
                                                        lineItem = lineItem.replace(/'/g, `''`)

                                                        await query(
                                                            `update ${tables.abandoned_carts} set 
                                                                    total_line_count = ${totalCount}, 
                                                                    cart_price = ${cart_price},
                                                                    data = data::jsonb || '{"line_items": ${lineItem}, "total_price": ${new_total_price}}'
                                                                    where cart_id = '${cartId}'`
                                                        )
                                                        await updateDraftOrderByCartId(cartId)
                                                    }
                                                }
                                            }
                                        })
                                        .catch(error => {
                                            if (enable_exception_log == 1)
                                                console.log('ERROR: getProductDetails: ', error)
                                        })
                                }
                            } else {
                                query(`update ${tables.abandoned_carts} set total_line_count = 0, cart_price = 0, data = data::jsonb || '{"line_items": ${JSON.stringify(newLineItems)}}' where cart_id = '${cartId}'`)
                            }
                        }
                    })
                    .catch(error => { if (enable_exception_log == 1) console.log('ERROR: Get Cart Data by ID: ', error.message) });
            }
        })
        .catch(error => { if (enable_exception_log == 1) console.log('ERROR: Total Line Count: ', error.message) });
};

/**
 * Function to Get Product Details
 * @param    {Object} lineItem             Line Item
 * @param    {String} storeId              Store Id
 * @return   {Object}                      Returns product details after query process
 */
const getProductDetails2 = async (lineItem, storeId) => {
    try {
        if (lineItem["variant_id"]) {
            const getAsset = getWhereQuery(tables.products, `shopify_store_id='${storeId}' AND shopify_variant_id='${lineItem["variant_id"]}'`);
            const queryData = await query(getAsset);

            return queryData.rows[0] ? {
                uuid: queryData.rows[0]['id'],
                zbooni_product_id: queryData.rows[0]['zbooni_product_id'],
                assets: queryData.rows[0]['zbooni_product_details']['data']['assets'],
                name: queryData.rows[0]['zbooni_product_details']['data']['name'],
                is_active: queryData.rows[0]['zbooni_product_details']['data']['is_active'],
                outOfStock: queryData.rows[0]['zbooni_product_details']['data']['outOfStock'],
                price_value: queryData.rows[0]['zbooni_product_details']['data']['price_value'],
                stock_count: queryData.rows[0]['zbooni_product_details']['data']['stock_count'],
                inventoryPolicy: queryData.rows[0]['zbooni_product_details']['data']['inventoryPolicy'],
                tracksInventory: queryData.rows[0]['zbooni_product_details']['data']['tracksInventory'],
                selectedOptions: queryData.rows[0]['zbooni_product_details']['data']['selectedOptions'],
                is_deleted: queryData.rows[0]['is_deleted'],
            } : [];
        }
    } catch (exception) {
        if (enable_exception_log == 1)
            console.log('exception in getProductDetails', exception)
    }
};

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

const updateDraftOrderByCartId = async (cartId) => {
    await query(getCartsWithDraftOrderIdAcrossStore(), [cartId])
        .then(async resStoreACartData => {
            if (resStoreACartData.rows.length > 0) {
                let cartObj = resStoreACartData.rows[0]
                await sleep(1000)
                let new_line_items = [];
                for (const lineItemObj of cartObj.line_items) {

                    let isOutOfStock = ''
                    if (lineItemObj?.tracksInventory)
                        if ((lineItemObj?.inventoryPolicy == 'DENY' || lineItemObj?.inventoryPolicy == 'deny') && lineItemObj?.stock_count <= 0) isOutOfStock = true
                        else isOutOfStock = false
                    else isOutOfStock = false

                    if (isOutOfStock == false) {
                        let isStockValue = '';
                        if (lineItemObj?.tracksInventory)
                            (lineItemObj.stock_count < lineItemObj.quantity && (lineItemObj?.inventoryPolicy == 'DENY' || lineItemObj?.inventoryPolicy == 'deny'))
                                ? isStockValue = true
                                : isStockValue = false
                        else isStockValue = false

                        if (isStockValue) {
                            lineItemObj.quantity = lineItemObj.stock_count
                        }

                        new_line_items.push(lineItemObj)
                    }
                }

                if (new_line_items.length > 0) {
                    let shopifyCreds = { shopName: cartObj.shopify_store_name, accessToken: cartObj.shopify_store_access_token }
                    let updateDraftOrderObj = {
                        shopifyCreds,
                        draftOrderId: cartObj.draft_order_id,
                        lineItems: new_line_items,
                        customerId: cartObj.customer_id,
                        shipping_lines: cartObj.shipping_lines
                    }

                    updateDraftOrderByIdOnShopify(updateDraftOrderObj)
                        .then(resp => {
                            enable_log_detail == 1 && console.log('RESPONSE: ', new Date(), ' updateDraftOrderOnShopify: ', { status: resp.status, statusText: resp.statusText });

                            if (resp.status === 200) {
                                if (enable_log_detail == 1) console.log("Draft Order has been Updated Successfully with status code: ", resp.status)
                                return;
                            } else {
                                if (enable_log_detail == 1) console.log("Something went wrong!. Draft Order has not been updated with status code: ", resp.status)
                                return
                            }
                        })
                        .catch(error => {
                            if (enable_exception_log == 1) console.log('ERROR: updateDraftOrderOnShopify: ', JSON.stringify(error))
                            return
                        });
                }

            }
        }).catch(error => {
            if (enable_exception_log == 1) console.log('ERROR: getCartsWithDraftOrderIdAcrossStore: ', error.message)
            return
        });
}

/**
 * Function that Update Draft Order by ID on shopify
 * @param    {String} draftOrderId        Draft Order ID
 * @param    {Object} shopifyCreds        Shopify Credentials
 * @param    {Array}  lineItems           List of Products
 * @return   {Object}                     Return a promise
 */
const updateDraftOrderByIdOnShopify = async ({ shopifyCreds, draftOrderId, customerId, lineItems, shipping_lines }) => {
    if (lineItems.length) {
        const body = formatDraftOrderBody({ customerId, lineItems });
        let draftOrderClient = axios.create({
            baseURL: `https://${shopifyCreds.shopName}.myshopify.com/admin/api/${process.env.shopifyApiVersion}`,
            timeout: process.env.API_TIMEOUT,
            headers: { 'Content-Type': `application/json`, 'X-Shopify-Access-Token': shopifyCreds.accessToken }
        })
        const response = await draftOrderClient.put(`/draft_orders/${draftOrderId}.json`, body);
        return response;
    } else
        if (enable_log_detail == 1) console.log('updateDraftOrderByIdOnShopify 3: No body found.');
};

/**
 * Function that Formatting Draft order body for Shopify
 * @param    {String} customerId      Customer ID
 * @param    {Array} lineItems        List of Products
 * @return   {Object}                 Returns draft order object after formatting
 */
const formatDraftOrderBody = ({ customerId = '', lineItems = [], shipping_lines = [] }) => {
    const lineItemsArray = [];

    lineItems.forEach(({ title, variant_id, quantity, discountedPrice, price, outOfStock }) => {
        if (!outOfStock) {
            const discount = discountedPrice ? price - discountedPrice : 0;
            lineItemsArray.push({
                "title": title,
                "price": price,
                "quantity": quantity,
                "variant_id": variant_id,
                "applied_discount": {
                    "description": "Custom discount",
                    "value_type": "fixed_amount",
                    "value": discount,
                    "amount": discount,
                    "title": "Custom"
                }
            });
        }
    });

    return {
        "draft_order": {
            "line_items": lineItemsArray,
            "customer": {
                "id": customerId
            },
            "use_customer_default_address": true
        }
    };
};