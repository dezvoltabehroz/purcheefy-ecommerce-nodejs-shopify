'use strict'

// Getting dependencies
const Pool = require('pg').Pool;

// Getting environment variables
const { db_host, db_port, db_username, db_password, db_database } = process.env;

// Setting DB credentials
let connectionObj = {
  user: db_username,
  host: db_host,
  database: db_database,
  password: db_password,
  port: db_port,
};

// Creating DB pool
const pool = new Pool(connectionObj);

// Exporting Query to interact with DB
module.exports = {
  async query(query, params = []) {
    return new Promise((resolve, reject) => {
      pool.query(query, params, (error, results) => { error ? reject(error) : resolve(results) });
    });
  },
};
