"use strict";

// Getting dependencies

// Query DB
const { query, connection } = require("../dbLayer");

// Getting db queries for migrations
const tables = require("../dbLayer/db.migration");

// =============================================== Controllers ========================================================

// DB Migrations
exports.dbMigrations = async (req, res, next) => {
    try {
        const data = {};
        const createDBSchema = tables.createSchemaQuery();
        const createCustomersTable = tables.createCustomersTableQuery();
        const createStoreDetailsTable = tables.createStoreDetailsTableQuery();
        const createProductTable = tables.createProductTableQuery();
        const createAbandonedCartTable = tables.createAbandonedCartTableQuery();
        const createStoreJobTable = tables.createStoreJobsTableQuery();
        const createBuyerTable = tables.createBuyerTableQuery();
        const createBasketTable = tables.createBasketTableQuery();
        const createOrderTable = tables.createOrderTableQuery();
        const createBasketItemsTable = tables.createBasketItemsTableQuery();
        const createUsersTable = tables.createUsersTableQuery();
        const createFollowUpNotesTable = tables.createFollowUpNotesTableQuery();
        const createFollowUpNotesAssetsTable = tables.createFollowUpNotesAssetsTableQuery();
        const createNotificationSettingsTable = tables.createNotificationSettingsTable();
        const createNotificationsTable = tables.createNotificationsTable();
        const createEventsTable = tables.createEventsTable();
        const createMessageTemplates = tables.createMessageTemplatesTable();
        const alterBasketTable = tables.alterBasketTableQuery();
        const alterAbandonedCartsTable = tables.alterAbandonedCartsTableQuery();
        const alterProductTableWithNameTable = tables.alterProductTableWithName();
        const updateProductNameColumnQuery = tables.updateProductNameColumn();
        const updateCartOriginalValueColumnQuery = tables.updateCartOriginalValueColumn();
        const addAttemptedAtInCartColumnQuery = tables.addAttemptedAtInCartColumn();
        const addCustomerIdInCartColumnQuery = tables.addCustomerIdInCartColumn();
        const addShopperCountInCartColumnQuery = tables.addShopperCountInCartColumn();
        const alterAbandonedCartsDraftOrderIdTable = tables.alterAbandonedCartsDraftOrderIdTableQuery();
        const alterAbandonedCartsInvoiceURLTable = tables.alterAbandonedCartsInvoiceURLTableQuery();
        const alterAbandonedCartsIsDraftUpdatedTable = tables.alterAbandonedCartsIsDraftUpdatedTableQuery();
        const createAbandonedCartBackupTableQuery = tables.createAbandonedCartBackupTableQuery();
        const createUserCartReadTable = tables.createUserCartReadTable();
        const createIndexOnUserCartReadTable = tables.createIndexOnUserCartReadTable();
        const addNotifyOfOnNewCartsInNotificationSettingsTableQuery = tables.addNotifyOfOnNewCartsInNotificationSettingsTableQuery();
        const addNewCartsNotificationRelatedColumnsInUsersTableQuery = tables.addNewCartsNotificationRelatedColumnsInUsersTableQuery();

        await new Promise((resolve, reject) => {
            query(createDBSchema)
                .then(async () => {
                    data.DBSchema = 'Created Successfully';
                    await query(createCustomersTable)
                        .then(() => data.customerTable = 'Created Successfully')
                        .catch(e => data.customerTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createStoreDetailsTable)
                        .then(() => data.storeDetailTable = 'Created Successfully')
                        .catch(e => data.storeDetailTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createProductTable)
                        .then(() => data.productTable = 'Created Successfully')
                        .catch(e => data.productTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createAbandonedCartTable)
                        .then(() => data.abandonedCartTable = 'Created Successfully')
                        .catch(e => data.abandonedCartTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createStoreJobTable)
                        .then(() => data.createStoreJobTable = 'Created Successfully')
                        .catch(e => data.createStoreJobTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createBuyerTable)
                        .then(() => data.createBuyerTable = 'Created Successfully')
                        .catch(e => data.createBuyerTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createBasketTable)
                        .then(() => data.createCheckoutsTable = 'Created Successfully')
                        .catch(e => data.createCheckoutsTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createOrderTable)
                        .then(() => data.createOrderTable = 'Created Successfully')
                        .catch(e => data.createOrderTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createBasketItemsTable)
                        .then(() => data.createBasketItemsTable = 'Created Successfully')
                        .catch(e => data.createBasketItemsTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createUsersTable)
                        .then(() => data.createUsersTable = 'Created Successfully')
                        .catch(e => data.createUsersTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createFollowUpNotesTable)
                        .then(() => data.createFollowUpNotesTable = 'Created Successfully')
                        .catch(e => data.createFollowUpNotesTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createFollowUpNotesAssetsTable)
                        .then(() => data.createFollowUpNotesAssetsTable = 'Created Successfully')
                        .catch(e => data.createFollowUpNotesAssetsTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createNotificationSettingsTable)
                        .then(() => data.createNotificationSettingsTable = 'Created Successfully')
                        .catch(e => data.createNotificationSettingsTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createNotificationsTable)
                        .then(() => data.createNotificationsTable = 'Created Successfully')
                        .catch(e => data.createNotificationsTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createEventsTable)
                        .then(() => data.createEventsTable = 'Created Successfully')
                        .catch(e => data.createEventsTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createMessageTemplates)
                        .then(() => data.createMessageTemplates = 'Created Successfully')
                        .catch(e => data.createMessageTemplates = 'ERROR: Creation failed: ' + e.message);
                    await query(alterBasketTable)
                        .then(() => data.alterBasketTable = 'Alter Successfully')
                        .catch(e => data.alterBasketTable = 'Database Response: ' + e.message);
                    await query(alterAbandonedCartsTable)
                        .then(() => data.alterAbandonedCartsTable = 'Alter Successfully')
                        .catch(e => data.alterAbandonedCartsTable = 'Database Response: ' + e.message);
                    await query(alterProductTableWithNameTable)
                        .then(() => data.alterProductTableWithNameTable = 'Alter Successfully')
                        .catch(e => data.alterProductTableWithNameTable = 'Database Response: ' + e.message);
                    await query(updateProductNameColumnQuery)
                        .then(() => data.updateProductNameColumnQuery = 'Update Products Name Successfully')
                        .catch(e => data.updateProductNameColumnQuery = 'Database Response: ' + e.message);
                    await query(updateCartOriginalValueColumnQuery)
                        .then(() => data.updateCartOriginalValueColumnQuery = 'Update Cart Original Value Successfully')
                        .catch(e => data.updateCartOriginalValueColumnQuery = 'Database Response: ' + e.message);
                    await query(addAttemptedAtInCartColumnQuery)
                        .then(() => data.addAttemptedAtInCartColumnQuery = 'Add Attempted At In Cart Successfully')
                        .catch(e => data.addAttemptedAtInCartColumnQuery = 'Database Response: ' + e.message);
                    await query(addCustomerIdInCartColumnQuery)
                        .then(() => data.addCustomerIdInCartColumnQuery = 'Add Customer Id In Cart Successfully')
                        .catch(e => data.addCustomerIdInCartColumnQuery = 'Database Response: ' + e.message);
                    await query(addShopperCountInCartColumnQuery)
                        .then(() => data.addShopperCountInCartColumnQuery = 'Add Shopper Count In Cart Successfully')
                        .catch(e => data.addShopperCountInCartColumnQuery = 'Database Response: ' + e.message);
                    await query(alterAbandonedCartsDraftOrderIdTable)
                        .then(r => data.alterAbandonedCartsDraftOrderIdTable = 'Alter Successfully')
                        .catch(e => data.alterAbandonedCartsDraftOrderIdTable = 'Database Response: ' + e.message);
                    await query(alterAbandonedCartsInvoiceURLTable)
                        .then(r => data.alterAbandonedCartsInvoiceURLTable = 'Alter Successfully')
                        .catch(e => data.alterAbandonedCartsInvoiceURLTable = 'Database Response: ' + e.message);
                    await query(alterAbandonedCartsIsDraftUpdatedTable)
                        .then(r => data.alterAbandonedCartsIsDraftUpdatedTable = 'Alter Successfully')
                        .catch(e => data.alterAbandonedCartsIsDraftUpdatedTable = 'Database Response: ' + e.message);
                    await query(createAbandonedCartBackupTableQuery)
                        .then(r => data.createAbandonedCartBackupTableQuery = 'Created Successfully')
                        .catch(e => data.createAbandonedCartBackupTableQuery = 'ERROR: Creation failed: ' + e.message);
                    await query(createUserCartReadTable)
                        .then(() => data.createUserCartReadTable = 'Created Successfully')
                        .catch(e => data.createUserCartReadTable = 'ERROR: Creation failed: ' + e.message);
                    await query(createIndexOnUserCartReadTable)
                        .then(() => data.createIndexOnUserCartReadTable = 'Index created Successfully')
                        .catch(e => data.createIndexOnUserCartReadTable = 'ERROR: Index creation failed: ' + e.message);
                    await query(addNotifyOfOnNewCartsInNotificationSettingsTableQuery)
                        .then(() => data.addNotifyOfOnNewCartsInNotificationSettingsTableQuery = 'Alter Successfully')
                        .catch(e => data.addNotifyOfOnNewCartsInNotificationSettingsTableQuery = 'Database Response: ' + e.message);
                    await query(addNewCartsNotificationRelatedColumnsInUsersTableQuery)
                        .then(() => data.addNewCartsNotificationRelatedColumnsInUsersTableQuery = 'Alter Successfully')
                        .catch(e => data.addNewCartsNotificationRelatedColumnsInUsersTableQuery = 'Database Response: ' + e.message);
                    resolve();
                })
                .catch(e => data.DBSchema = 'ERROR: Creation failed: ' + e.message);
        });
        res.reply({ data });
    } catch (error) {
        console.error(error)
        next(error);
    }
};

exports.checkConnection = async (req, res, next) => {
    connection()
        .then(resp => res.reply({ data: resp }))
        .catch(error => next(error))
}

// ============================================= Helper Functions =====================================================
