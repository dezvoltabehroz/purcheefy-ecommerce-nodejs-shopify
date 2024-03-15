'use strict'

// Getting shopify's axios clients
const { shopifyGraphqlClient, shopifyRestClient } = require('./axios.service');

/**
 * Function that generates a promise for shopify graphql API
 * @param    {Object} params        Contains multiple parameters
 *         - {String} body          Graphql query/mutation as request body
 *         - {String} shopName      Shopify's store name
 *         - {String} accessToken   Shopify's access token
 * @return   {Promise<string>}      Promise
 */
exports.shopifyGraphqlAPIPromise = (params) => shopifyPromise({ ...params, type: 'graphql' });

/**
 * Function that generates a promise for shopify rest API
 * @param    {Object} params        Contains multiple parameters
 *         - {String} body          Request body
 *         - {String} method        Request method (i.e. POST, GET, PUT, DELETE)
 *         - {String} url           Sub URL
 *         - {String} shopName      Shopify's store name
 *         - {String} accessToken   Shopify's access token
 * @return   {Promise<string>}      Promise
 */
exports.shopifyRestAPIPromise = (params) => shopifyPromise({ ...params, type: 'rest' });

/**
 * Function that creates a promise for shopify APIs
 * @param    {Object} params        Contains multiple parameters
 *         - {String} body          Request body
 *         - {String} method        Request method (i.e. POST, GET, PUT, DELETE)
 *         - {String} url           Sub URL
 *         - {String} type          Type of API (i.e graphql, rest)
 *         - {String} shopName      Shopify's store name
 *         - {String} accessToken   Shopify's access token
 * @return   {Promise<string>}      Promise
 */
const shopifyPromise = (params) => {
    let { API, METHOD, URL } = generateAPICreds(params);
    return new Promise((resolve, reject) => {
        API(params)[METHOD](URL, params.body)
            .then(res => resolve(res))
            .catch(e => reject({ message: e?.message || '', errors: e?.response?.data?.errors || [] }));
    });
};

/**
 * Function that creates API creds
 * @param    {Object} params        Contains multiple parameters
 *         - {String} body          Request body
 *         - {String} method        Request method (i.e. POST, GET, PUT, DELETE)
 *         - {String} url           Sub URL
 *         - {String} type          Type of API (i.e graphql, rest)
 * @return   {Object}               API credentials
 */
const generateAPICreds = ({ type, method, url }) => {
    if (type === 'graphql') return { API: shopifyGraphqlClient, METHOD: 'post', URL: '/graphql.json' };
    else return { API: shopifyRestClient, METHOD: method, URL: url };
};
