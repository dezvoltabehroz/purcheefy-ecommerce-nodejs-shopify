"use strict";

// Getting dependencies
const format = require('pg-format');

// Getting environment variables
const { db_username, db_database } = process.env;

const moment = require('moment-timezone');

// database Queries
module.exports = {
  // ========================================================= DB Data Migration =========================================================
  createDatabaseQuery: () => `CREATE DATABASE acb WITH OWNER = ${db_username} ENCODING = 'UTF8' LC_COLLATE = 'English_Pakistan.1252' LC_CTYPE = 'English_Pakistan.1252' TABLESPACE = pg_default CONNECTION LIMIT = -1; COMMENT ON DATABASE acb IS 'Abandoned cart backend'`,
  createSchemaQuery: () => `CREATE SCHEMA IF NOT EXISTS ${db_database} AUTHORIZATION ${db_username}`,
  createBuyerTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.zabooni_buyers
  (
      id varchar(256) DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) NOT NULL,
      email varchar(100) NOT NULL,
      store_id integer NOT NULL,
      abandoned_cart_id BIGINT NOT NULL,
      url varchar(300) NOT NULL,
      created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT zabooni_buyers_pkey PRIMARY KEY (store_id, email, abandoned_cart_id)
  )`,
  createBasketTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.zabooni_baskets
  (
      id varchar(256) default uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) not null,
      store_id integer not null,
      user_id integer not null,
      abandoned_cart_id bigint not null,
      basket_id bigint not null,
      buyer_url varchar(300) not null,
      checkout_url varchar(300) not null
        constraint zabooni_baskets_checkout_url_key
        unique,
      created_at timestamp default CURRENT_TIMESTAMP,
        constraint zabooni_baskets_pkey
        primary key (store_id, user_id, abandoned_cart_id)
  )`,
  createCustomersTableQuery: () => `create table if not exists ${db_database}.customers
  (
    id varchar(256) default uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) not null,
    username varchar(256) NULL,
    password varchar(256) NULL,
    email varchar(256) NULL,
    currency character varying(256) COLLATE pg_catalog."default" NOT NULL DEFAULT 'PKR'::character varying,
    subscribe_marketing boolean NOT NULL DEFAULT false
  )`,
  createStoreDetailsTableQuery: () => `create table if not exists ${db_database}.store_details
  (
    id varchar(256) default uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) not null,
    customer_id varchar(256) not null,
    store_type varchar(256) NOT NULL,
    store_credentials_details TEXT NOT NULL,
    enable_product_sync boolean NOT NULL DEFAULT false,
    is_product_sync_completed boolean NOT NULL DEFAULT false,
    is_shopify_checkout boolean NOT NULL DEFAULT false
  )`,
  createProductTableQuery: () => `create table if not exists ${db_database}.products
  (
    id varchar(256) default uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) not null
    constraint products_pkey primary key,
    shopify_store_id varchar(256) not null,
    shopify_product_id varchar(256) not null,
    shopify_variant_id varchar(256) not null,
    product_details json not null,
    is_deleted boolean default false,
    constraint products_shopify_store_id_shopify_product_id_shopify_varian_key
    unique (shopify_store_id, shopify_product_id, shopify_variant_id)
  ) TABLESPACE pg_default`,
  createAbandonedCartTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.abandoned_carts
  (
    id varchar(256) DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) NOT NULL,
    store_id BIGINT NOT NULL,
    cart_id BIGINT NOT NULL,
    token character varying(100) NOT NULL,
    cart_token character varying(100) NOT NULL,
    completed_at timestamp without time zone,
    closed_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    deleted_at timestamp without time zone,
    total_line_count integer default 0,
    cart_price float default 0,
    data json NOT NULL,
    status character varying(256) DEFAULT 'new',
    checkout_status character varying(256) DEFAULT NULL,
    attempts integer default 0,
    modified_by bigint default null,
    cart_created_at timestamp not null,
    cart_activated_at timestamp default null,
    cart_recovered_at timestamp default null,
    PRIMARY KEY(store_id, cart_id)
  )`,
  createAbandonedCartBackupTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.abandoned_carts_backup
  (
    id varchar(256) DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) NOT NULL,
    store_id BIGINT NOT NULL,
    cart_id BIGINT NOT NULL,
    token character varying(100) NOT NULL,
    cart_token character varying(100) NOT NULL,
    completed_at timestamp without time zone,
    closed_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    deleted_at timestamp without time zone,
    total_line_count integer default 0,
    cart_price float default 0,
    data json NOT NULL,
    status character varying(256) DEFAULT 'new',
    checkout_status character varying(256) DEFAULT NULL,
    attempts integer default 0,
    modified_by bigint default null,
    cart_created_at timestamp not null,
    cart_activated_at timestamp default null,
    cart_recovered_at timestamp default null,
    is_edited boolean NOT NULL DEFAULT false,
    original_cart_value double precision NOT NULL DEFAULT 0.0,
    attempted_at timestamp without time zone,
    customer_id bigint,
    shopper_count integer,
    draft_order_id bigint,
    invoice_url character varying(256),
    is_draft_updated boolean NOT NULL DEFAULT true,
    PRIMARY KEY(store_id, cart_id)
  )`,
  createStoreJobsTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.store_jobs
  (
    id varchar(256) DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) NOT NULL,
    store_id integer NOT NULL,
    executed_at timestamp without time zone,
    CONSTRAINT store_jobs_pkey PRIMARY KEY (id),
    CONSTRAINT store_jobs_store_id_key UNIQUE (store_id)
  )`,
  createOrderTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.orders
  (
    id varchar(256) default uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) not null,
    store_id varchar(256) not null,
    basket_id varchar(256) not null,
    order_id varchar(256) not null,
    order_details json not null,
    status varchar(100) not null,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(store_id, basket_id)
  )`,
  createBasketItemsTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.zabooni_basket_items
  (
    id varchar(256) DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) NOT NULL UNIQUE,
    store_id integer NOT NULL,
    abandoned_cart_id BIGINT NOT NULL,
    basket_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity integer NOT NULL,
    item_id BIGINT NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(store_id, abandoned_cart_id, basket_id, item_id, product_id)
  )`,
  createUsersTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.users
  (
    id character varying(256) NOT NULL DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring),
    user_id integer NULL,
    user_email character varying(256) NULL,
    fcm_token character varying [] NULL,
    endpoint_arn character varying [] NULL,
    user_data json NULL,
    CONSTRAINT users_pkey PRIMARY KEY (user_id)
  )`,
  createFollowUpNotesTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.follow_up_notes
  (
    id character varying(256) COLLATE pg_catalog."default" NOT NULL DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring),
    title character varying(256) COLLATE pg_catalog."default" NOT NULL,
    description character varying(256) COLLATE pg_catalog."default" NOT NULL,
    date character varying(256) COLLATE pg_catalog."default" NOT NULL,
    created_at character varying(256) COLLATE pg_catalog."default" NOT NULL DEFAULT date_part('epoch'::text, now()),
    user_id integer NOT NULL,
    cart_id bigint NOT NULL,
    CONSTRAINT follow_up_notes_pkey PRIMARY KEY (id)
  )`,
  createFollowUpNotesAssetsTableQuery: () => `CREATE TABLE IF NOT EXISTS ${db_database}.follow_up_notes_assets
  (
      id character varying(256) COLLATE pg_catalog."default" NOT NULL DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring),
      follow_up_notes_id character varying(256) COLLATE pg_catalog."default" NOT NULL,
      assets character varying(256) COLLATE pg_catalog."default" NOT NULL,
      created_at character varying(256) COLLATE pg_catalog."default" NOT NULL DEFAULT date_part('epoch'::text, now()),
      CONSTRAINT follow_up_notes_assets_pkey PRIMARY KEY (id)
  )`,
  createNotificationSettingsTable: () => `create table if not exists ${db_database}.notification_settings
  (
    id varchar(256) default uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) not null,
    user_id varchar(256) not null,
    notify_of_checkouts boolean default true,
    notify_of_changes_in_cart boolean default true,
    notify_of_failed_payments boolean default true,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
  )`,
  createNotificationsTable: () => `create table if not exists ${db_database}.notifications
  (
    id varchar(256) default uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) not null,
    store_id integer not null,
    user_id integer not null,
    message varchar(256) not null,
    category varchar(256) not null,
    status varchar(256) not null,
    is_read integer default 0 not null,
    cart_id varchar(256) not null,
    order_id varchar(256) default null,
    created_at timestamp default CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  createEventsTable: () => `CREATE TABLE IF NOT EXISTS ${db_database}.events
  (
    id character varying(256) COLLATE pg_catalog."default" NOT NULL DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring),
    created_at character varying(256) COLLATE pg_catalog."default" NOT NULL,
    event_type character varying(256) COLLATE pg_catalog."default" NOT NULL,
    price character varying(256) COLLATE pg_catalog."default",
    CONSTRAINT events_pkey PRIMARY KEY (id)
  )`,
  createMessageTemplatesTable: () => `CREATE TABLE IF NOT EXISTS ${db_database}.message_templates
  (
    id character varying(256) COLLATE pg_catalog."default" NOT NULL DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring),
    title character varying(256) COLLATE pg_catalog."default" NOT NULL,
    message character varying(256) COLLATE pg_catalog."default" NOT NULL,
    created_at character varying(256) COLLATE pg_catalog."default" NOT NULL DEFAULT date_part('epoch'::text, now()),
    user_id integer NOT NULL,
    is_default integer DEFAULT 0,
    store_id integer NOT NULL,
    CONSTRAINT message_templates_pkey PRIMARY KEY (id)
  )`,
  createUserCartReadTable: () => `CREATE TABLE IF NOT EXISTS ${db_database}.user_cart_read
  (
      id varchar(256) DEFAULT uuid_in((md5(((random())::text || (clock_timestamp())::text)))::cstring) NOT NULL,
      user_id integer not null,
      cart_id BIGINT NOT NULL,
      CONSTRAINT user_cart_read_pkey PRIMARY KEY (id)
  )`,
  createIndexOnUserCartReadTable: () => `create unique index if not exists idx_user_cart_read on ${db_database}.user_cart_read (user_id, cart_id)`,
  alterBasketTableQuery: () => `ALTER TABLE ${db_database}.zabooni_baskets ADD fulfillment_url character varying(300) COLLATE pg_catalog."default"`,
  alterAbandonedCartsTableQuery: () => `ALTER TABLE IF EXISTS ${db_database}.abandoned_carts ADD is_edited boolean NOT NULL DEFAULT false`,
  alterProductTableWithName: () => `ALTER TABLE ${db_database}.products ADD product_name character varying(256) COLLATE pg_catalog."default"`,
  updateProductNameColumn: () => `update ${db_database}.products set product_name = product_details::jsonb->'data' ->> 'name'`,
  updateCartOriginalValueColumn: () => `ALTER TABLE ${db_database}.abandoned_carts ADD original_cart_value double precision NOT NULL DEFAULT 0.0`,
  addAttemptedAtInCartColumn: () => `ALTER TABLE ${db_database}.abandoned_carts ADD attempted_at timestamp without time zone`,
  addCustomerIdInCartColumn: () => `ALTER TABLE ${db_database}.abandoned_carts ADD customer_id bigint`,
  addShopperCountInCartColumn: () => `ALTER TABLE ${db_database}.abandoned_carts ADD shopper_count integer`,
  alterAbandonedCartsDraftOrderIdTableQuery: () => `ALTER TABLE ${db_database}.abandoned_carts ADD draft_order_id bigint`,
  alterAbandonedCartsInvoiceURLTableQuery: () => `ALTER TABLE ${db_database}.abandoned_carts ADD invoice_url character varying(256) COLLATE pg_catalog."default"`,
  alterAbandonedCartsIsDraftUpdatedTableQuery: () => `ALTER TABLE ${db_database}.abandoned_carts ADD is_draft_updated boolean NOT NULL DEFAULT true`,
  insertIntoUserCartReadQuery: (tableName) => `INSERT INTO ${tableName}(user_id, cart_id) VALUES ($1, $2)`,
  upsertUserCartRead: (tableName, values) => format(`INSERT INTO ${tableName} (user_id, cart_id) VALUES %L ON CONFLICT ( user_id, cart_id ) DO NOTHING`, values),
  addNotifyOfOnNewCartsInNotificationSettingsTableQuery: () => `ALTER TABLE ${db_database}.notification_settings ADD IF NOT EXISTS notify_of_new_carts boolean default true`,
  addNewCartsNotificationRelatedColumnsInUsersTableQuery: () => `ALTER TABLE ${db_database}.users ADD IF NOT EXISTS is_new_carts_notification_read boolean default false, ADD IF NOT EXISTS new_carts_notification_count integer default 0`,
  alterQueries: [``]
};
