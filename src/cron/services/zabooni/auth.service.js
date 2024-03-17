'use strict';

// Getting dependencies

// Get enviroment variables
const { client_id, client_secret, grant_type, enable_log_detail } = process.env;

// Getting zbooni services
const zaboonService = require("../zabooni.sevice")

/**
 * Function to Login User at zbooni
 * @param     username
 * @param     password
 * @return    {Object}        Returns Login Response
 */
exports.login = (username = null, password = null) => {

    if (username && password) {
        const data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": grant_type,
            "username": username,
            "password": password
        };
        return zaboonService.zbooniPromise({ method: 'post', url: '/oauth/token/', body: data });
    } else {
        enable_log_detail == 1
            ? console.log('ERROR: Login: username OR password not found', { username, password })
            : console.log('ERROR: Login: username OR password not found')
        return null;
    }
}
