`use strict`;

// Getting environment variables
const { db_database } = process.env;

module.exports = {
  shopify_store_info: `${db_database}.shopify_store_info`,
  products: `${db_database}.products`,
  abandoned_carts: `${db_database}.abandoned_carts`,
  abandoned_carts_backup: `${db_database}.abandoned_carts_backup`,
  store_jobs: `${db_database}.store_jobs`,
  zabooni_buyers: `${db_database}.zabooni_buyers`,
  zabooni_checkouts: `${db_database}.zabooni_checkouts`,
  events: `${db_database}.events`
};