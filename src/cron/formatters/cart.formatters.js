'use strict'

const moment = require('moment-timezone');

/**
 * Function that Format Cart response to be stored in DB
 * @param    {String} storeId           Store Id
 * @param    {Object} abandonedCart     Abandoned Cart
 * @return   {Array}                    Returns array after formatting
 */
exports.formatResponseForDB = ({ storeId, abandonedCart = {} }) => {
    const { store_id, cart_id, token, cart_token, data, created_at, updated_at, completed_at, closed_at, deleted_at, cart_price, original_cart_value, total_line_count, cart_created_at } = {
        store_id: storeId,
        cart_id: abandonedCart.id,
        token: `${abandonedCart.token}` || '',
        cart_token: `${abandonedCart.cart_token}` || '',
        data: `${JSON.stringify(abandonedCart)}`,
        created_at: `${abandonedCart.created_at}`,
        updated_at: `${abandonedCart.updated_at}`,
        completed_at: abandonedCart.completed_at ? `${abandonedCart.completed_at}` : null,
        closed_at: abandonedCart.closed_at ? `${abandonedCart.closed_at}` : null,
        deleted_at: abandonedCart.deleted_at ? `${abandonedCart.deleted_at}` : null,
        cart_price: `${parseFloat(abandonedCart.total_price) == 0 ? 0 : parseFloat(abandonedCart.total_price) + parseFloat(abandonedCart?.shipping_lines[0]?.price)}` || '',
        original_cart_value: `${parseFloat(abandonedCart.total_price) == 0 ? 0 : parseFloat(abandonedCart.total_price) + parseFloat(abandonedCart?.shipping_lines[0]?.price)}` || '',
        total_line_count: `${abandonedCart.total_line_count}`,
        cart_created_at: moment.utc().format("Y-MM-DD HH:mm:ss")
    };

    return [store_id, cart_id, token, cart_token, data, created_at, updated_at, completed_at, closed_at, deleted_at, cart_price, original_cart_value, total_line_count, cart_created_at]
};

/**
 * Function to Format Line Item
 * @param    {Object} lineItem          Line Item
 * @param    {Object} product           Product
 * @param    {Boolean} isOutOfStock     Out of stock status
 * @return   {Object}                   Returns object after formatting
 */
exports.formatLineItem = (lineItem, product, isOutOfStock, stock_count, tracksInventory, inventoryPolicy, selectedOptions) => {
    let title = ''
    lineItem?.variant_title
        ? title = `${lineItem.title}` || null
        : title = `${lineItem.title}` || null

    return {
        uuid: product?.uuid || null,
        zbooniProductId: product?.zbooni_product_id || null,
        variant_id: lineItem.variant_id || null,
        title: title,
        vendor: lineItem.vendor,
        quantity: lineItem.quantity || null,
        price: lineItem.price || null,
        applied_discounts: lineItem.applied_discounts || [],
        discount_allocations: lineItem.discount_allocations || [],
        zbooniDiscount: lineItem.zbooniDiscount || null,
        discountedPrice: lineItem.discountedPrice || null,
        discountType: lineItem.discountType || null,
        outOfStock: isOutOfStock,
        assets: product?.assets || [],
        stock_count: stock_count || 0,
        tracksInventory: tracksInventory || false,
        inventoryPolicy: inventoryPolicy || "DENY",
        selectedOptions: selectedOptions || []
    };
};
