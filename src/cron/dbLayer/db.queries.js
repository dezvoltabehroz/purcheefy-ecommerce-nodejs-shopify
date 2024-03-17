"use strict";
const format = require('pg-format');

// Getting environment variables
const tableObj = require('../dbLayer/db.tables');

// database Queries
module.exports = {
  // =========================== New Queries =============================
  getAllStores: () => `select * from ${tableObj.store_details}`,
  getStoreJobs: () => `select * from ${tableObj.store_jobs} where store_id = $1`,
  upsertCart: (values) => format(`INSERT INTO ${tableObj.abandoned_carts} ( store_id, cart_id, token, cart_token, data, created_at, updated_at, completed_at, closed_at, deleted_at,cart_price,original_cart_value,total_line_count,cart_created_at ) VALUES %L ON CONFLICT ( store_id, cart_id ) DO UPDATE SET token = EXCLUDED.token, cart_token = EXCLUDED.cart_token, data = EXCLUDED.data, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, completed_at = EXCLUDED.completed_at, closed_at = EXCLUDED.closed_at, deleted_at = EXCLUDED.deleted_at, cart_price = EXCLUDED.cart_price, total_line_count = EXCLUDED.total_line_count WHERE ${tableObj.abandoned_carts}.status != 'recovered' and ${tableObj.abandoned_carts}.status != 'active' and ${tableObj.abandoned_carts}.status != 'archived'`, values),
  upsertCartBackup: (values) => format(`INSERT INTO ${tableObj.abandoned_carts_backup} ( store_id, cart_id, token, cart_token, data, created_at, updated_at, completed_at, closed_at, deleted_at,cart_price,original_cart_value,total_line_count,cart_created_at ) VALUES %L ON CONFLICT ( store_id, cart_id ) DO UPDATE SET token = EXCLUDED.token, cart_token = EXCLUDED.cart_token, data = EXCLUDED.data, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, completed_at = EXCLUDED.completed_at, closed_at = EXCLUDED.closed_at, deleted_at = EXCLUDED.deleted_at, cart_price = EXCLUDED.cart_price, total_line_count = EXCLUDED.total_line_count WHERE ${tableObj.abandoned_carts_backup}.status != 'recovered' and ${tableObj.abandoned_carts_backup}.status != 'active' and ${tableObj.abandoned_carts_backup}.status != 'archived'`, values),


  // =========================== Old Queries =============================
  selectAllQuery: (tableName, cols = '*') => `select ${cols} from ${tableName}`,
  countWhereQuery: (tableName, condition) => `SELECT COUNT('*') FROM ${tableName} WHERE ${condition}`,
  updateWhereQuery: (tableName, keyPairValues, condition) => {
    const setValues = Object.keys(keyPairValues).map(key => key + "=" + keyPairValues[key]).join(", ");
    return `UPDATE ${tableName} SET ${setValues} WHERE ${condition}`;
  },
  getStoreInfoQuery: (tableName) => `select * from ${tableName} where shopify_store_id = $1`,
  insertFirebaseEventQuery: (tableName) => `insert into ${tableName} ( created_at, event_type, price )	VALUES ($1, $2, $3) returning id,created_at, event_type`,
  insertIntoQuery: (tableName, keyPairValues) => {
    const columns = Object.keys(keyPairValues);
    const values = Object.values(keyPairValues);
    return `INSERT INTO ${tableName}(${columns}) VALUES(${values}) returning id`;
  },
  getWhereQuery: (tableName, condition, cols = '*') => `SELECT ${cols} FROM ${tableName} WHERE ${condition}`,
  upsertData: (tableName, keyPairValues, uniqueKeys) => {
    const columns = Object.keys(keyPairValues);
    const values = Object.values(keyPairValues);
    const setValues = Object.keys(keyPairValues).map(key => key + "=" + keyPairValues[key]).join(", ");
    return `INSERT INTO ${tableName}(${columns}) VALUES(${values}) ON CONFLICT (${uniqueKeys}) DO UPDATE SET ${setValues}`
  },
  
  
  getProductDetails: (tableName) => `select * from ${tableName} where shopify_product_id = $1 and shopify_variant_id = $2`,
  upsertProduct: (tableName, values) => format(` INSERT INTO ${tableName} ( shopify_store_id, zbooni_product_id, shopify_product_id, shopify_variant_id, zbooni_product_details ) VALUES %L ON CONFLICT ( shopify_store_id, shopify_product_id, shopify_variant_id ) DO UPDATE SET zbooni_product_details = EXCLUDED.zbooni_product_details, zbooni_product_id = EXCLUDED.zbooni_product_id;`, values),
  getProductFromDB: () => `select store_info.zbooni_username,store_info.zbooni_password,store_info.shopify_store_name,store_info.shopify_store_access_token,products.* 
    from ${db_database}.products products
    inner join ${db_database}.shopify_store_info store_info on store_info.shopify_store_id = CAST (products.shopify_store_id AS INTEGER) 
    where products.is_sync_zbooni = false and products.zbooni_product_id = '' and products.shopify_store_id = $1
    limit 100`,
  upsertProductUpdate: (values) => format(` INSERT INTO ${db_database}.products ( shopify_store_id, zbooni_product_id, shopify_product_id, shopify_variant_id, zbooni_product_details ) VALUES %L ON CONFLICT ( shopify_store_id, shopify_product_id, shopify_variant_id ) DO UPDATE SET zbooni_product_details = EXCLUDED.zbooni_product_details, zbooni_product_id = EXCLUDED.zbooni_product_id;`, values),
  updateProductSyncStatus: () => `update ${db_database}.products set zbooni_product_id = $1, is_sync_zbooni='true' 
    where shopify_product_id = $2 and shopify_variant_id = $3`,
  getCartsWithNegativeValue: () => `select cart_price,cart_id from ${db_database}.abandoned_carts where cart_price < 0`,
  updateCustomerIdInCarts: () => `update ${db_database}.abandoned_carts set customer_id = CAST (data->'customer'->>'id' as bigint) where customer_id is null`,
  getCustomerIdWithNullStoreCountCarts: () => `select distinct ac.customer_id, ssi.shopify_store_name,ssi.shopify_store_access_token 
    from ${db_database}.abandoned_carts ac
    inner join ${db_database}.shopify_store_info ssi on ssi.shopify_store_id = ac.store_id
    where ac.shopper_count is null and ac.customer_id is not null`,
  getCustomerIdInCarts: () => `select distinct ac.customer_id, ssi.shopify_store_name,ssi.shopify_store_access_token
    from ${db_database}.abandoned_carts ac
    inner join ${db_database}.shopify_store_info ssi on ssi.shopify_store_id = ac.store_id
    where ac.customer_id is not null`,
  updateShopperCountInCarts: () => `update ${db_database}.abandoned_carts set shopper_count = $1 where customer_id = $2`,
  getCustomerIdByCartInCarts: () => `select ac.customer_id ,CAST(ac.data->'customer'->>'id' as bigint) as cart_customer_id, ssi.shopify_store_name,ssi.shopify_store_access_token
    from acb.abandoned_carts ac
    inner join acb.shopify_store_info ssi on ssi.shopify_store_id = ac.store_id
    where ac.cart_id = $1`,
  getCartsWithDraftOrderIdAcrossStore: () => `select store.shopify_store_name,store.shopify_store_access_token,carts.cart_id, carts.draft_order_id, carts.invoice_url, 
    carts.data::jsonb -> 'shipping_lines'  as shipping_lines,  
    carts.data::jsonb -> 'customer' ->> 'id' as customer_id,
    carts.data::jsonb -> 'line_items' as line_items
    from ${db_database}.abandoned_carts carts
    inner join ${db_database}.shopify_store_info store on store.shopify_store_id = carts.store_id
    where cart_id = $1 and carts.status != 'recovered' and carts.draft_order_id is not null and carts.invoice_url is not null`
};
