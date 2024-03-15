'use strict'

// Getting Dependencies
const crypto = require('crypto');
const { secret_key, secret_iv, encryption_method } = require('../config/config')

// Generate secret hash with crypto to use for encryption
const key = crypto
    .createHash('sha512')
    .update(secret_key)
    .digest('hex')
    .substring(0, 32)
const encryptionIV = crypto
    .createHash('sha512')
    .update(secret_iv)
    .digest('hex')
    .substring(0, 16)

/**
 * Encrypts the provided data using a specific encryption algorithm and key.
 * 
 * @param {string} data - The data to be encrypted.
 * @returns {string} - The encrypted data as a string.
 */
const encryptData = (data) => {
    const cipher = crypto.createCipheriv(encryption_method, key, encryptionIV)
    return Buffer.from(
        cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64')
}

/**
 * Decrypt encrypted data using a decryption algorithm.
 * 
 * @param {*} encryptedData - The data to be decrypted.
 * @returns - The decrypted data or the result of the decryption operation.
 */
const decryptData = (encryptedData) => {
    const buff = Buffer.from(encryptedData, 'base64')
    const decipher = crypto.createDecipheriv(encryption_method, key, encryptionIV)
    return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8')
    )
}

module.exports = {
    encryptData,
    decryptData
}