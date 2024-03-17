'use strict'

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
exports.healthCheckResponse = {
  success: true,
  responseStatus: "OK",
  message: "Request processed successfully.",
  data: { message: "Server is Working", datetime: Date.now() }
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