'use strict'

// Getting dependencies

// Promise based HTTP client for the browser and node.js
const axios = require('axios');

// Getting environments
const { shopifyApiVersion, API_TIMEOUT, baseURL } = process.env;

/**
 * Function that creates axios client for shopify graphql API
 * @param    {Object} params        Contains multiple parameters
 *         - {String} shopName      Shopify's store name
 *         - {String} accessToken   Shopify's access token
 * @return   {Object}               axios client
 */
exports.shopifyGraphqlClient = (params = {}) => axios.create(generateOptions({ ...params, type: 'graphql' }));

/**
 * Function that creates axios client for shopify rest API
 * @param    {Object} params        Contains multiple parameters
 *         - {String} shopName      Shopify's store name
 *         - {String} accessToken   Shopify's access token
 * @return   {Object}               axios client
 */
exports.shopifyRestClient = (params = {}) => axios.create(generateOptions({ ...params, type: 'json' }));

/**
 * Function that generates axios client options
 * @param    {Object} params        Contains multiple parameters
 *         - {String} shopName      Shopify's store name
 *         - {String} accessToken   Shopify's access token
 *         - {String} type          Type of API (i.e graphql, json)
 * @return   {Object}               axios client
 */
const generateOptions = ({ shopName, accessToken, type }) => {
    return {
        baseURL: getBaseURL(shopName),
        timeout: API_TIMEOUT,
        headers: {
            'Content-Type': `application/${type}`,
            'X-Shopify-Access-Token': accessToken
        }
    }
};

/**
 * Function that generates base URL
 * @param    {String} shopName      Shopify's store name
 * @return   {String}               Base URL
 */
const getBaseURL = (shopName) => `https://${shopName}.myshopify.com/admin/api/${shopifyApiVersion}`;

// zbooni API client
exports.zbooniRestClient = (accessToken = "", multipartHeaders = "") => axios.create({
    baseURL: baseURL,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': multipartHeaders ? multipartHeaders['content-type'] : `application/json`,
        'Authorization': accessToken ? `Bearer ${accessToken}` : ''
    }
});
