"use strict";

// Getting dependencies

// Getting form-data
const FormData = require("form-data");

// Getting path
const Path = require('path');

// Getting fs
const fs = require('fs');

// Getting axios
const axios = require('axios');

// Getting zbooni API promise
const { zbooniPromise } = require('../services/zbooni.service');

/**
 * Function that download image from shopify cdn uri promise
 * @param    {String}  url     Url to download image
 * @return   {Object}          Return Success after downloading image
 */
const downloadImage = (url) => {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `${Math.floor(new Date().getTime())}MyFile.jpg`;
            const dir = Path.resolve(Path.join(__dirname, '../mediaUploads'));

            !fs.existsSync(dir) && fs.mkdirSync(dir);

            const path = Path.resolve(dir, fileName);
            const writer = fs.createWriteStream(path);

            axios({ url, method: 'get', responseType: 'stream' })
                .then(resp => {
                    resp.data.pipe(writer);
                    writer.on('finish', () => resolve({ message: "Write Stream Success", path: path }));
                    writer.on('error', () => reject({ message: "Write Stream Error" }));
                })
                .catch(e => reject(e))
        } catch (e) {
            reject(e);
        }
    })
};

/**
 * Function that translations Media asset 
 * @param    {String}  url          Url of Media asset
 * @param    {String}  storeId      Store ID
 * @param    {String}  productId    Product ID
 * @param    {String}  token        Access Token
 * @return   {Object}               Return Success after translates Media asset 
 */
exports.mediaAssetsTranslation = (url, storeId, productId, token) => {
    return new Promise((resolve, reject) => {
        // downloadImage(url)
        //     .then(respo => {
        //         const path = respo.path;
        //         const formData = new FormData();
        //         formData.append('asset', fs.createReadStream(path));

        const formData = new FormData();
        formData.append('asset_urls', url);

        zbooniPromise({ method: 'post', url: `/stores/${storeId}/products/${productId}/assets/`, body: formData, accessToken: token })
            .then(resp => {
                // unLinkFile(path);
                resolve(resp)
            })
            .catch(error => {
                // unLinkFile(path);
                reject(error?.response?.data)
            })
        // })
        // .catch(err => reject(err))
    })
};

/**
 * Function that unLinks File
 * @param    {String}  path         path of media storage
 * @return   {Object}               Return success after unlinks file
 */
const unLinkFile = (path) => {
    try {
        fs.unlinkSync(path);
    } catch (e) {
        console.log('ERROR: Image Unlink: ', e)
    }
};

/**
 * Function that translations Media asset 
 * @param    {String}  storeId      Store ID
 * @param    {String}  productId    Product ID
 * @param    {String}  token        Access Token
 * @return   {Object}               Return Success after translates Media asset 
 */
exports.getProductAssets = (storeId, productId, token) => {
    return new Promise((resolve, reject) => {
        zbooniPromise({ method: 'get', url: `/stores/${storeId}/products/${productId}/assets/`, accessToken: token })
            .then(resp => { resolve(resp.results) })
            .catch(error => { reject(error?.response?.data) })
    })
};

/**
 * Function that translations Media asset 
 * @param    {String}  storeId      Store ID
 * @param    {String}  productId    Product ID
 * @param    {String}  assetId    Product ID
 * @param    {String}  token        Access Token
 * @return   {Object}               Return Success after translates Media asset 
 */
exports.deleteProductAssets = (storeId, productId, token, assetId) => {
    return new Promise((resolve, reject) => {
        zbooniPromise({ method: 'delete', url: `/stores/${storeId}/products/${productId}/assets/${assetId}/`, accessToken: token })
            .then(resp => resolve(resp))
            .catch(error => reject(error?.response))
    })
};