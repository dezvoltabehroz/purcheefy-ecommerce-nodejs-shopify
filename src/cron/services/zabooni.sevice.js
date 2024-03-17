'use strict'

// Getting zbooni's axios client
const { zbooniRestClient } = require('./axios.service');

/**
 * Function that creates zbooni's API promise
 * @param    {Object} params            Contains multiple parameters
 *         - {String} body              Request body
 *         - {String} method            Request method (i.e. POST, GET, PUT, DELETE)
 *         - {String} url               Sub URL
 *         - {String} accessToken       Access Token
 * @return   {Object}                   Returns a Promise
 */
exports.zbooniPromise = ({ method, url, body, accessToken }) => {
    let multipartHeaders = "";
    if (body?._streams !== undefined) {
        multipartHeaders = body.getHeaders();
    }

    return new Promise((resolve, reject) => {
        zbooniRestClient(accessToken, multipartHeaders)[method](url, body)
            .then(res => resolve(res.data))
            .catch(e => reject(e));
    });
};
