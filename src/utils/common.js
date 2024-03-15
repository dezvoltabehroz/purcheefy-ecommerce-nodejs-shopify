'use strict'

// Getting dependencies
const lodash = require('lodash');
const moment = require('moment-timezone');

// Getting jwt
const jwt = require('jsonwebtoken');

// Getting Shopify Queries
const { getShopifyVariantInventoryQuery } = require('../utils/shopify.queries');

// Getting shopify API promise
const { shopifyGraphqlAPIPromise } = require('../services/shopify.service');

/**
 * Function that validates email
 * @param    {String} email        User's Email ID
 * @return   {String} email        Returns Validated Users's Email ID
 */
exports.validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Function that validates required fields
 * @param    {Object} object        object
 * @param    {Object} fields        Required fields
 * @return   {String}               Returns error message after fields validation
 */
exports.validateFields = (object, fields) => {
  const errors = [];
  fields.forEach((f) => {
    if (!(object && object[f]))
      errors.push(f);
  });
  return errors.length ? `${errors.join(', ')} are required fields.` : '';
};

/**
 * Function that generates unique ID
 * @param    {Number} length      length
 * @return   {String}             Returns an unique ID
 */
exports.uniqueId = (length = 13) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Creating health check response
exports.healthCheckResponse = { data: { message: "Server is Working", datetime: Date.now() } };

/**
 * Function that Verify jwt Token and getting data
 * @param    {String} storeInfoToken      store information token
 * @param    {String} secretKey           secret key
 * @return   {Object}                     Return Success that received after token validation
 */
exports.verifyToken = (storeInfoToken, secretKey) => {
  return new Promise((resolve, reject) => {
    if (storeInfoToken != null && secretKey != null) {
      jwt.verify(storeInfoToken, secretKey, (error, response) => {
        if (error) {
          reject(error);
          // res.reply({ statusCode: 400, message: error, })
        }
        resolve(response.obj);
        // res.reply({ data: response.obj })
      });
    } else {
      reject("Invalid Token or Secret")
    }
  });
};

/**
 * Function that Get last index
 * @param    {Array}  data      store information token
 * @return   {Number}           Returns last index of array
 */
exports.getLastIndex = data => {
  let dataArray = data.split("/");
  return dataArray[dataArray.length - 1];
};

/**
 * Function that is Query builder for getting all products from zbooni
 * @param    {String}  params      given parameter
 * @return   {String}              Returns query according to given parameter
 */
exports.queryBuilder = (params) => {
  let query = `?`
  const { search, ordering, is_active, is_public, slug, tags__slug__in, collection, collection__not_in, page, page_size } = params;

  if (search) {
    query === '?' ? query = query.concat('search=', search) : query = query.concat('&search=', search)
  }

  if (ordering) {
    query === '?' ? query = query.concat('ordering=', ordering) : query = query.concat('&ordering=', ordering)
  }

  if (is_active) {
    query === '?' ? query = query.concat('is_active=', is_active) : query = query.concat('&is_active=', is_active)
  }

  if (is_public) {
    query === '?' ? query = query.concat('is_public=', is_public) : query = query.concat('&is_public=', is_public)
  }

  if (slug) {
    query === '?' ? query = query.concat('slug=', slug) : query = query.concat('&slug=', slug)
  }

  if (tags__slug__in) {
    query === '?' ? query = query.concat('tags__slug__in=', tags__slug__in) : query = query.concat('&tags__slug__in=', tags__slug__in)
  }

  if (collection) {
    query === '?' ? query = query.concat('collection=', collection) : query = query.concat('&collection=', collection)
  }

  if (collection__not_in) {
    query === '?' ? query = query.concat('collection__not_in=', collection__not_in) : query = query.concat('&collection__not_in=', collection__not_in)
  }

  if (page && page_size) {
    query === '?' ? query = query.concat(`page=${page}&page_size=${page_size}`) : query = query.concat(`&page=${page}&page_size=${page_size}`)
  }

  return query.length === 1 ? '' : query;
};

/**
 * Function that write json on file
 * @param    {Object}  jsonObj      Json Object
 * @return   {Object}               Return Success that received after json file saved
 */
exports.writeJsonToFile = (jsonObj) => {
  // file system module to perform file operations
  const fs = require('fs');

  // stringify JSON Object
  const jsonContent = JSON.stringify(jsonObj);
  console.log(jsonContent);

  fs.writeFile("shopifyProductsDump.json", jsonContent, 'utf8', function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }
    console.log("JSON file has been saved.");
  });
};

/**
 * Function that is filters builder for getting abandoned cart from acb
 * @param    {String}  storeId                store ID
 * @param    {String}  userId                 user ID
 * @param    {String}  status                 store information token
 * @param    {String}  numberOfAttempts       store information token
 * @return   {String}                         Returns query
 */
exports.filterBuilder = (storeId, userId, status, numberOfAttempts) => {
  let filters = `where store_id = '${storeId}' AND completed_at is null AND closed_at is null`;

  if (userId && status !== 'new')
    filters = filters.concat(` AND modified_by = '${userId}'`);

  switch (status) {
    case "open":
      filters = filters.concat(" AND completed_at is null AND closed_at is null")
      break;
    case "closed":
      filters = filters.concat(" AND closed_at is not null")
      break;
    case "completed":
      filters = filters.concat(" AND completed_at is not null")
      break;
    case "new":
      filters = filters.concat(" AND status = 'new'")
      break;
    case "active":
      filters = filters.concat(" AND status = 'active'")
      break;
    case "recovered":
      filters = filters.concat(" AND status = 'recovered'")
      break;
    case "archived":
      filters = filters.concat(" AND status = 'archived'")
      break;
  }

  switch (numberOfAttempts) {
    case '1':
      filters = filters.concat(" AND attempts = 1")
      break;
    case '2':
      filters = filters.concat(" AND attempts = 2")
      break;
    case '3':
      filters = filters.concat(" AND attempts = 3")
      break;
    case '4':
      filters = filters.concat(" AND attempts >= 3")
      break;
  }

  return filters;
}

/**
 * Function that gets formated date time (i.e 2022-06-01T17:46:06Z)
 * @return   {String}               Returns formated date
 */
exports.getFormatedDateTime = () => {
  let currentDate = new Date()
  let date = new Date(currentDate.getTime());

  let day = date.getDate()
  let hours = date.getHours()
  let year = date.getFullYear()
  let minutes = date.getMinutes()
  let seconds = date.getSeconds()
  let month = Math.floor(date.getMonth() + 1)
  day = (day < 10 ? "0" + day : day)
  hours = (hours < 10 ? "0" + hours : hours)
  month = (month < 10 ? "0" + month : month)
  minutes = (minutes < 10 ? "0" + minutes : minutes)
  seconds = (seconds < 10 ? "0" + seconds : seconds)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
};

/**
 * Function that returns 3 object arrays of items to Add/Update/Delete by comparing two object arrays
 * @param    {Array}    firstArray      First object array
 * @param    {Array}    secondArray     Second object array
 * @param    {String}   firstArrayKey   First array key to compare with
 * @param    {String}   secondArrayKey  Second array key to compare with
 * @return   {Object}                   Returns Object containing three arrays of itemsToAdd/itemsToUpdate/itemsToDelete
 */
exports.getAddUpdateDeleteObjectArraysFromTwoObjectArraysComparison = (firstArray, secondArray, firstArrayKey, secondArrayKey) => {
  let itemsToUpdate = firstArray.filter(firstItem => secondArray.some(secondItem => firstItem[firstArrayKey].toString().toLowerCase() === secondItem[secondArrayKey].toString().toLowerCase()));
  let itemsToAdd = firstArray.filter(firstItem => !secondArray.some(secondItem => firstItem[firstArrayKey].toString().toLowerCase() === secondItem[secondArrayKey].toString().toLowerCase()));
  let itemsToDelete = secondArray.filter(firstItem => !firstArray.some(secondItem => firstItem[secondArrayKey].toString().toLowerCase() === secondItem[firstArrayKey].toString().toLowerCase()));

  return {
    itemsToAdd: lodash.uniqBy(itemsToAdd, firstArrayKey),
    itemsToUpdate: lodash.uniqBy(itemsToUpdate, firstArrayKey),
    itemsToDelete: lodash.uniqBy(itemsToDelete, secondArrayKey),
  }
};

exports.getSubtractedTime = (fromTime, duration, unit) => moment(fromTime).subtract(duration, unit).format("Y-MM-DD HH:mm:ss");

/**
 * Function that get track inventory boolean across every variant id in the array
 * @param    {Array}    shopName        Shopify Store Name
 * @param    {Array}    accessToken     Access Token from shopify store
 * @param    {Array}    variantArr      First object array
 * @return   {Object}                   Returns Array with Track Inventory Boolean
 */
exports.updateVariantWithTrackInventoryBool = async (shopName, accessToken, variantArr) => {
  let newVariantArr = [];
  for (const variantObj of variantArr) {
    const reqParams = { shopName, accessToken, body: getShopifyVariantInventoryQuery(variantObj?.variant_id ? variantObj?.variant_id : variantObj.id) };
    let variantDetail = await shopifyGraphqlAPIPromise(reqParams)

    let newSelectedOptions = variantDetail?.data?.data?.productVariant?.selectedOptions.filter(function (item) {
      return item.name !== 'Title' && item.value !== 'Default Title'
    });

    variantObj.inventoryItem = variantDetail?.data?.data?.productVariant?.inventoryItem
    variantObj.selectedOptions = newSelectedOptions
    newVariantArr.push(variantObj)
  }

  return newVariantArr
};