"use strict";

// Getting dependencies

// Query DB
const { query } = require("../dbLayer");

// Getting db queries
const { insertFirebaseEventQuery } = require("../dbLayer/db.queries");

// Getting db tables
const { events } = require("../dbLayer/db.tables");

// =============================================== Controllers ========================================================

// ============================================= Helper Functions =====================================================

exports.saveFirebaseEvents = (created_at, event_type, price) => {
    return new Promise((resolve, reject) => {

        const insertFirebaseEvents = insertFirebaseEventQuery(events);
        const values = [created_at, event_type, price];

        query(insertFirebaseEvents, values)
            .then((resp) => resolve(resp))
            .catch((error) => reject(error));
    })
};
