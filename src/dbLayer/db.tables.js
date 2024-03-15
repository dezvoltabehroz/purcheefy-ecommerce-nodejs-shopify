`use strict`;

// Getting environment variables
const { db_database } = process.env;

module.exports = {
  customers: `${db_database}.customers`,
  store_details: `${db_database}.store_details`,
  products: `${db_database}.products`,
  abandoned_carts: `${db_database}.abandoned_carts`,
  orders: `${db_database}.orders`,
  purcheefy_buyers: `${db_database}.purcheefy_buyers`,
  purcheefy_baskets: `${db_database}.purcheefy_baskets`,
  discount_code: `${db_database}.discount_code`,
  purcheefy_basket_items: `${db_database}.purcheefy_basket_items`,
  users: `${db_database}.users`,
  follow_up_notes: `${db_database}.follow_up_notes`,
  follow_up_notes_assets: `${db_database}.follow_up_notes_assets`,
  notification_settings: `${db_database}.notification_settings`,
  notifications: `${db_database}.notifications`,
  storeJobs: `${db_database}.store_jobs`,
  events: `${db_database}.events`,
  message_templates: `${db_database}.message_templates`,
  user_cart_read: `${db_database}.user_cart_read`
};
