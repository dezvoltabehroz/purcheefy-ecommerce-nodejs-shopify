'use strict'

// Getting dependencies
const { getLastIndex } = require('../utils/common');

/**
 * Function that Formatting products graphql bulk response to zbooni request body format
 * @param    {Object} product           List of products
 * @param    {Object} variant           List of items
 * @param    {String} currencyCode      Currency code
 * @return   {Object}                   Returns object after formatting products to request body
 */
exports.formatBulkProductsDataToZbooniFormat = (product, variant, currencyCode = null) => {
    let name = '';
    variant?.title
        ? name = `${product?.title} - ${variant?.title}` || ''
        : name = `${product?.title}` || ''

    const requestBody = {
        name: name,
        description: product?.description || '',
        price_value: variant?.price || '',
        brand: product?.vendor || '',
        tags: [] //product?.tags || []
    };

    if (currencyCode) requestBody.price_currency = currencyCode;

    return requestBody
};

/**
 * Function that Generate response to store in DB
 * @param    {String} storeId               store ID
 * @param    {Object} product               List of products
 * @param    {Object} variant               List of items
 * @param    {Object} response              Custome Object
 * @param    {Array} assets                 Array of Assets
 * @return   {Object}                       Returns store object
 */
exports.formatZbooniResponseForDB = ({ storeId, product = {}, variant = {}, response = {}, assets = [] }) => {
    const { shopifyStoreId, zbooniProductId, shopifyProductId, shopifyVariantId, zbooniProductDetails } = {
        shopifyStoreId: storeId,
        zbooniProductId: response.id || '',
        shopifyProductId: typeof product.id === 'string' && product.id.includes('gid') ? getLastIndex(product.id) : product.id,
        shopifyVariantId: typeof variant.id === 'string' && variant.id.includes('gid') ? getLastIndex(variant.id) : variant.id,
        zbooniProductDetails: { data: typeof response === 'string' ? response : { ...response, assets } }
    };

    return [shopifyStoreId, zbooniProductId, shopifyProductId, shopifyVariantId, zbooniProductDetails]
};