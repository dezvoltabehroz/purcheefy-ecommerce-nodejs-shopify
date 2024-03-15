'use strict'

//Getting dependencies
const dotenv = require('dotenv');

dotenv.config();

const {
    JWT_SECRET,
    EXPIRES_IN,
    SECRET_KEY,
    SECRET_IV,
    ENCRYPTION_METHOD
} = process.env

const config = {
    jwt_secret_key: JWT_SECRET,
    expiresIn: EXPIRES_IN,
    secret_key: SECRET_KEY,
    secret_iv: SECRET_IV,
    encryption_method: ENCRYPTION_METHOD
};

module.exports = config;
