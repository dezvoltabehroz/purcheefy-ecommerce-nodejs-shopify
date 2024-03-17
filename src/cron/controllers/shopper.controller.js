'use strict'

// Getting dependencies

// Getting Syncing Services

// Query DB
const { query } = require("../dbLayer");
const {
    updateCustomerIdInCarts,
    getCustomerIdInCarts,
    updateShopperCountInCarts,
    getCustomerIdByCartInCarts,
    getCustomerIdWithNullStoreCountCarts
} = require("../dbLayer/db.queries");

// Getting shopify Rest API promise
const { shopifyRestAPIPromise } = require('../services/shopify.service')

// =============================================== Controllers ========================================================

// Update Carts with Customer ID
exports.updateCustomerIdInCart = async () => {
    console.log("================ Update Carts with Customer ID================")
    await query(updateCustomerIdInCarts(), [])
    await query(getCustomerIdWithNullStoreCountCarts(), [])
        .then(async resCustomerData => {
            if (resCustomerData.rows.length > 0) {
                try {
                    for (const storeData of resCustomerData.rows) {
                        let shopifyCreds = { shopName: storeData.shopify_store_name, accessToken: storeData.shopify_store_access_token };
                        let orderRes = await getCustomerOrderHistoryById(shopifyCreds, storeData.customer_id)
                        let shopper_count = orderRes.data.orders.length;
                        await query(updateShopperCountInCarts(), [shopper_count, storeData.customer_id])
                        console.log("Update Shopper Count : ", shopper_count, " Customer Id: ", storeData.customer_id)
                    }
                } catch (err) {
                    console.log("updateCustomerIdInCart Error : ", err)
                }
            }
        })
}

// Update Shopper Count
exports.updateShopperCount = async () => {
    console.log("================ Update Shopper Count================")
    query(getCustomerIdInCarts(), [])
        .then(async resCustomerData => {
            if (resCustomerData.rows.length > 0) {
                for (const storeData of resCustomerData.rows) {
                    let shopifyCreds = { shopName: storeData.shopify_store_name, accessToken: storeData.shopify_store_access_token };
                    let orderRes = await getCustomerOrderHistoryById(shopifyCreds, storeData.customer_id)
                    let shopper_count = orderRes.data.orders.length;
                    query(updateShopperCountInCarts(), [shopper_count, storeData.customer_id])
                    console.log("Update Shopper Count : ", shopper_count, " Customer Id: ", storeData.customer_id)
                }
            }
        })
}

// Update Shopper Count based on cart ID
exports.updateShopperCountByCartId = async (req, res) => {
    console.log("================ Update Shopper Count based on cart ID================")
    const { cart_id } = req.query;
    query(getCustomerIdByCartInCarts(), [cart_id])
        .then(async resCustomerData => {
            if (resCustomerData.rows.length > 0) {
                for (const storeData of resCustomerData.rows) {
                    if (!storeData.customer_id)
                        this.updateCustomerIdInCart()

                    let shopifyCreds = { shopName: storeData.shopify_store_name, accessToken: storeData.shopify_store_access_token };
                    let orderRes = await getCustomerOrderHistoryById(shopifyCreds, storeData.customer_id ? storeData.customer_id : storeData.cart_customer_id)
                    let shopper_count = orderRes.data.orders.length + 1;
                    query(updateShopperCountInCarts(), [shopper_count, storeData.customer_id ? storeData.customer_id : storeData.cart_customer_id])
                    console.log("Update Shopper Count : ", shopper_count, " Customer Id: ", storeData.customer_id ? storeData.customer_id : storeData.cart_customer_id)
                }
            }
        })
    res.send({ message: "Update Shopper Count based on cart ID" });
}

// Get order history of customer by id from shopify
const getCustomerOrderHistoryById = (shopifyCreds, customerId) => {
    const params = { ...shopifyCreds, method: 'get', url: `/customers/${customerId}/orders.json?status=any` };
    return shopifyRestAPIPromise(params)
};