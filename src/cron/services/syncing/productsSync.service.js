'use strict';

// Getting form-data
const FormData = require("form-data");

// Getting db queries
const { getProductFromDB, selectAllQuery, updateProductSyncStatus } = require("../../dbLayer/db.queries");

// Query DB
const { query } = require("../../dbLayer");

// Getting db tables
const tables = require("../../dbLayer/db.tables");

// Getting Auth Services
const { login } = require("../zabooni/auth.service");

// Getting Store controller
const { getStoreDetailsFromDB } = require("../../controllers/store.controller");

// Services
const { shopifyGraphqlAPIPromise } = require("../shopify.service");
const { zbooniPromise } = require("../zabooni.sevice");

// Getting Shopify Queries
const { getShopifyVariantInventoryQuery } = require('../../utils/shopify.queries');

const { enable_log_detail, enable_exception_log } = process.env;

exports.syncProducts = async () => {
    const stores = await query(selectAllQuery(tables.shopify_store_info));
    if (stores.rowCount) {
        let productsList = [];
        for (const store of stores.rows) {
            if (store.enable_product_sync == true) {
                query(getProductFromDB(), [store.shopify_store_id])
                    .then(async (dbResProduct) => {
                        let dbProductLength = dbResProduct.rows.length;
                        if (dbProductLength > 0) {
                            let zbooniAccessToken = "";
                            // Store the start time of the process 
                            let startTime = Date.now()
                            let lastTimeOut = Date.now()

                            for (const [i, product] of dbResProduct.rows.entries()) {
                                if (i % 50 == 0) {
                                    if (enable_log_detail == 1) console.log('Token Refreshed');
                                    await login(product.zbooni_username, product.zbooni_password)
                                        .then(async ({ access_token }) => {
                                            try { zbooniAccessToken = access_token }
                                            catch (e) { if (enable_exception_log == 1) console.log('ERROR: ASYNC: createMultipleProductsOnZbooni: ', e) }
                                        })
                                        .catch(error => { if (enable_exception_log == 1) console.log('ERROR: customer login: ', error.response.data) });
                                }

                                if (zbooniAccessToken == "") {
                                    syncProducts()
                                } else {
                                    if (enable_log_detail == 1)
                                        console.log('\n===================== productCount =====================', (i + 1), '/', dbProductLength);
                                    console.log('Trying for: ', product.shopify_product_id, product.shopify_variant_id);
                                    let productObj = {
                                        zbooniAccessToken,
                                        storeId: product.shopify_store_id,
                                        product: formatProductObject(product.zbooni_product_details.data, product.shopify_variant_id),
                                        shopify_store_name: product.shopify_store_name,
                                        shopify_store_access_token: product.shopify_store_access_token
                                    }

                                    await createProductOnZbooni(productObj)
                                        .then(async response => {
                                            console.log("response : ", response)

                                            if (response.id) {
                                                let ctImage = 0
                                                if (product.zbooni_product_details.data.assets.length > 0) {
                                                    for (const image of product.zbooni_product_details.data.assets) {
                                                        await mediaAssetsTranslation(image.asset, product.shopify_store_id, response.id, zbooniAccessToken)
                                                            .then(resp => {
                                                                if (enable_log_detail == 1)
                                                                    console.log('Response Image: ', product.shopify_product_id, product.shopify_variant_id, resp);
                                                            })
                                                            .catch(error => {
                                                                if (enable_exception_log == 1)
                                                                    console.log('Error: Image Upload: ', error, product.shopify_product_id, product.shopify_variant_id)
                                                            });
                                                    }
                                                }
                                                query(updateProductSyncStatus(), [response.id, product.shopify_product_id, product.shopify_variant_id])
                                                    .then(() => console.log(`PRODUCT UPDATED PRODUCT_ID:${product.shopify_product_id} & VARIANT_ID:${product.shopify_variant_id}`))
                                                    .catch(err => console.log("ERROR updateProductSyncStatus ", err.error))

                                                productsList.push({ shopify_product_id: product.shopify_product_id, shopify_variant_id: product.shopify_variant_id, zbooni_product_id: response.id });
                                            }
                                        }).catch(error => {
                                            if (enable_exception_log == 1)
                                                console.log('ERROR: createMultipleProductsOnZbooni: ', error)
                                        })

                                }
                                let currentTime = Date.now()
                                let secondElapse = Math.round((currentTime - startTime) / 1000)
                                let lastDuration = Math.round((currentTime - lastTimeOut) / 1000)
                                lastTimeOut = currentTime
                                console.log('Excuted since : ', secondElapse)
                                console.log('Last Duration  : ', lastDuration)


                                if (secondElapse > 240 || lastDuration > 20) {
                                    console.log('Exit loop')
                                    return productsList;
                                }
                                let frozenUntil = Date.now() + (lastDuration * 100)
                                console.log('wait for  millisecond : ', Math.round(frozenUntil - Date.now()))
                                let doingNothing = 0
                                while (frozenUntil > Date.now()) {
                                    doingNothing++;
                                }
                            }
                            return productsList;
                        }
                    })
            }
        }

        return productsList;

    } else {
        return [{ success: false, message: 'Stores not found in db.' }]
    }
}



/**
 * Function that Add new product to DB
 * @param    {Object} Product             Product
 * @param    {Object} variant_id          Variant Id
 * @return   {Object}                     Return a promise
 */
const formatProductObject = (product, variant_id) => {

    const requestBody = {
        sku: variant_id,
        name: `${product?.name}`,
        description: `${product?.description}`,
        price_value: product?.price_value,
        brand: product?.brand,
        tags: [],
        variant_id: variant_id,
        price_currency: product.price_currency,
        is_public: false,
        stock_count: product?.stock_count > 0 ? product?.stock_count : 0
    };
    
    return requestBody
};


/**
 * Function that Create product on Zbooni
 * @param    {String} zbooniAccessToken       Access Token
 * @param    {String} storeId                 Store ID
 * @param    {Object} product                 product object
 * @return   {Object}                         Return a promise
 */
const createProductOnZbooni = async ({ zbooniAccessToken, storeId, product, shopify_store_name, shopify_store_access_token }) => {
    // product.stock_count = await getShopifyStockCount(storeId, product, shopify_store_name, shopify_store_access_token);
    // const requestParams = { accessToken: zbooniAccessToken, method: 'post', url: `/stores/${storeId}/products/`, body: product };
    // return zbooniPromise(requestParams).then(resp => resp).catch(error => error);

    const requestParams = { accessToken: zbooniAccessToken, method: 'post', url: `/stores/${storeId}/products/`, body: product };
    const requestGetProduct = { accessToken: zbooniAccessToken, method: 'get', url: `/stores/${storeId}/products/?sku=${product?.variant_id}` };

    return zbooniPromise(requestGetProduct)
        .then(productResp => {
            if (productResp.results.length > 0) {

                const requestUpdateProduct = { accessToken: zbooniAccessToken, method: 'patch', url: `/stores/${storeId}/products/${productResp.results[0].id}`, body: product };
                zbooniPromise(requestUpdateProduct)

                return ({ ...productResp.results[0], is_already_created: true })
            } else {
                return zbooniPromise(requestParams)
                    .then(resp => { return ({ ...resp, is_already_created: false }) })
                    .catch(error => error.message);
            }
        })
        .catch(error => error)
};

const getShopifyStockCount = (storeId, product, shopify_store_name, shopify_store_access_token) => {
    return new Promise((resolve, reject) => {
        const params = { shopName: shopify_store_name, accessToken: shopify_store_access_token, body: getShopifyVariantInventoryQuery(product.variant_id) };
        shopifyGraphqlAPIPromise(params)
            .then(async resp => {
                if (resp?.data?.data?.productVariant?.sellableOnlineQuantity < 0)
                    resolve(0)
                else
                    resolve(resp?.data?.data?.productVariant?.sellableOnlineQuantity)
            })
            .catch(error => error);
    })
}

/**
 * Function that translations Media asset 
 * @param    {String}  url          Url of Media asset
 * @param    {String}  storeId      Store ID
 * @param    {String}  productId    Product ID
 * @param    {String}  token        Access Token
 * @return   {Object}               Return Success after translates Media asset 
 */
const mediaAssetsTranslation = (url, storeId, productId, token) => {
    return new Promise((resolve, reject) => {

        const formData = new FormData();
        formData.append('asset_url', url);

        zbooniPromise({ method: 'post', url: `/stores/${storeId}/products/${productId}/assets/`, body: formData, accessToken: token })
            .then(resp => resolve(resp))
            .catch(error => reject(error?.response?.data))
    })
};