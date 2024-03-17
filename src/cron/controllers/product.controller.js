'use strict'

// Getting dependencies

// Getting environments
const { client_id, client_secret, grant_type } = process.env;

// Query DB
const { query } = require('../dbLayer');
const tables = require("../dbLayer/db.tables");
const { getProductDetails, upsertProduct } = require('../dbLayer/db.queries');

// Getting response formatters
const {
    formatBulkProductsDataToZbooniFormat,
    formatZbooniResponseForDB
} = require('../formatters/product.formatters');

// Getting media asset upload
const { mediaAssetsTranslation } = require('../utils/assets');

// Getting common health check response message
const { healthCheckResponse } = require('../utils/common');

// Getting shopify API promise
const { shopifyGraphqlAPIPromise } = require('../services/shopify.service');

// Getting shopify queries
const { getShopifyVariantInventoryQuery, getProductQuery, getShopInfo } = require('../utils/shopify.queries');

// Getting zbooni API promise
const { zbooniPromise } = require('../services/zabooni.sevice');

// Getting response formatters
const storeController = require('./store.controller');
const dbTables = require('../dbLayer/db.tables');

const { enable_exception_log } = process.env;

// =============================================== Controllers ========================================================

// Health check
exports.health = (req, res, next) => res.send(healthCheckResponse);

// ============================================= Helper Functions =====================================================

/**
 * Function that checks variant inventory on shopify
 * @param    {String} storeId               Store ID
 * @param    {String} variantId             Shopify variant ID
 * @return   {Object}                       Return a promise
 */
exports.checkVariantInventoryOnShopify = ({ storeId, variantId }) => {
    return storeController.getStoreDetailsFromDB(storeId)
        .then(resp => {
            if (resp.rowCount) {
                const { shopify_store_name, shopify_store_access_token } = resp.rows[0];
                const params = { shopName: shopify_store_name, accessToken: shopify_store_access_token, body: getShopifyVariantInventoryQuery(variantId) };
                return shopifyGraphqlAPIPromise(params).then(resp => resp?.data).catch(error => error);
            }
        })
        .catch(error => {
            if (enable_exception_log == 1)
                console.log('ERROR: checkZbooniProductInventoryOnShopify: ', error)
        })
};

/**
 * Function that Update Product Detail in ACB and Zbooni
 * @param    {Object} productDet            Product Data
 * @param    {String} variantId             Shopify variant ID
 */
exports.updateProductDetail = (productDet, storeId, zbooniUsername, zbooniPassword) => {
    query(getProductDetails(dbTables.products), [productDet["product_id"], productDet["variant_id"]])
        .then(resProduct => {
            if (resProduct.rowCount == 0) {
                storeController.getStoreDetailsFromDB(storeId)
                    .then(resp => {
                        if (resp.rowCount) {
                            const { shopify_store_name, shopify_store_access_token } = resp.rows[0];
                            const params = { shopName: shopify_store_name, accessToken: shopify_store_access_token, body: getProductQuery(productDet["product_id"]) };
                            shopifyGraphqlAPIPromise(params)
                                .then(resp => {
                                    if (resp?.data?.data?.product)
                                        createProductsOverZbooni([resp?.data?.data?.product], zbooniUsername, zbooniPassword, storeId)
                                }).catch(error => error);
                        }
                    })
                    .catch(error => {
                        if (enable_exception_log == 1)
                            console.log('ERROR: UnableToFetchDataAcrossStoreId: ', error)
                    })
            }
        })
        .catch(error => {
            if (enable_exception_log == 1)
                console.log('ERROR: checkZbooniProductInventoryOnShopify: ', error)
        })
}

const createProductsOverZbooni = (newProducts, zbooniUsername, zbooniPassword, storeId) => {
    loginCustomer({ username: zbooniUsername, password: zbooniPassword })
        .then(({ access_token }) => {
            getShopifyShopDetails(storeId).then(async ({ currencyCode }) => {
                const requestParams = { storeId: storeId, products: newProducts, zbooniAccessToken: access_token, currencyCode };

                // Create products on Zbooni
                const productsArray = await createMultipleProductsOnZbooni(requestParams);

                // Add all products to DB
                upsertProductsToDB(productsArray);
            });
        })
        .catch(error => console.log('ERROR: customer login: ', error.response.data));
}

// ============================================= Helper Functions =====================================================

/**
 * Function that Login Customer
 * @param    {String} username         Customer's username
 * @param    {String} password         Customer's password
 * @return   {Object}                  Return API promise
 */
const loginCustomer = ({ username = null, password = null } = {}) => {
    if (username && password) {
        const body = {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": grant_type,
            "username": username,
            "password": password
        };

        return zbooniPromise({ method: 'post', url: '/oauth/token/', body: body });
    } else console.log('ERROR: Login: username OR password not found', { username, password });
};

/**
* Function that Get Shopify shop details
* @param    {String} storeId             Store ID
* @return   {Object}                     Return a promise
*/
const getShopifyShopDetails = (storeId) => {
    return new Promise((resolve, reject) => {
        query(`select * from ${dbTables.shopify_store_info} where shopify_store_id = $1`, [storeId])
            .then(resp => {
                if (resp.rows.length) {
                    const { shopify_store_name, shopify_store_access_token } = resp.rows[0];

                    const requestParams = { shopName: shopify_store_name, accessToken: shopify_store_access_token, body: getShopInfo() };
                    shopifyGraphqlAPIPromise(requestParams)
                        .then(resp => { resolve(resp?.data?.data?.shop) })
                        .catch(error => console.log('ERROR || Shopify shop details || ', error));
                }
            })
            .catch(error => console.log('ERROR || getShopifyShopDetails || ', error));
    })
};


/**
 * Function that Create multiple products on Zbooni
 * @param    {Object} params                parameter object
 * @return   {Object}                       Return list of products after creating
 */
const createMultipleProductsOnZbooni = async (params) => {
    const productsList = [];

    for (const [i, product] of params.products.entries()) {
        for (const variantData of product.variants.edges) {
            let variant = variantData.node;
            await createProductOnZbooni({ ...params, product: formatBulkProductsDataToZbooniFormat(product, variant, params.currencyCode) })
                .then(async response => {
                    const assets = [];
                    if (response.id) {
                        const images = getAllImages(product, variant);

                        for (const image of images) {
                            await mediaAssetsTranslation(image, params.storeId, response.id, params.zbooniAccessToken)
                                .then(resp => {
                                    console.log('Response Image: ', product.id, variant.id, resp.id);
                                    assets.push(resp);
                                })
                                .catch(error => console.log('Error: Image Upload: ', error.message, product.id, variant.id));
                        }
                    }
                    productsList.push(formatZbooniResponseForDB({ ...params, product, variant, response, assets }));
                }).catch(error => console.log('ERROR: createMultipleProductsOnZbooni: ', error.message))
        }
    }

    return productsList;
};

/**
 * Function that Create product on Zbooni
 * @param    {String} zbooniAccessToken       Access Token
 * @param    {String} storeId                 Store ID
 * @param    {Object} product                 product object
 * @return   {Object}                         Return a promise
 */
const createProductOnZbooni = ({ zbooniAccessToken, storeId, product }) => {
    const requestParams = { accessToken: zbooniAccessToken, method: 'post', url: `/stores/${storeId}/products/`, body: product };

    return zbooniPromise(requestParams).then(resp => resp).catch(error => error.message);
};

/**
 * Function that Create multiple products on Zbooni
 * @param    {Array}  product                List of products
 * @param    {Array}  variant                List of Items
 * @return   {Object}                        Return object of images
 */
const getAllImages = (product, variant) => {
    let images = [];

    if (variant?.image) {
        if (variant?.image && variant?.image?.url.includes('cdn'))
            images.push(variant.image.url);
    }

    product.images.edges.forEach(imageData => {
        let image = imageData.node.image;
        if (image?.src && image?.src.includes('cdn'))
            images.push(image.src);
        else if (image && image.includes('cdn'))
            images.push(image);
    });

    return images;
};

/**
 * Function that Add new product to DB
 * @param    {Object} values              Values to insert
 * @return   {Object}                     Return a promise
 */
const upsertProductsToDB = (values) => {
    const upsertProductQuery = upsertProduct(tables.products, values);

    if (upsertProductQuery.includes('jsonb) ON CONFLICT ('))
        query(upsertProductQuery)
            .then((resp) => console.log('RESPONSE: WEBHOOK: PRODUCT ADD || rowCount ', resp.rowCount))
            .catch((error) => console.log('ERROR: WEBHOOK: PRODUCT ADD: ', error));
};
