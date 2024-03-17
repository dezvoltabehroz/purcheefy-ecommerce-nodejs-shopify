'use strict';

// Getting dependencies

// Getting zbooni services
const { zbooniPromise } = require('../zabooni.sevice')

// Getting buyer services
const buyerService = require('../database/buyer.service')

const { enable_exception_log } = process.env;

/**
 * Function to Create Buyer at zbooni and in db
 * @param    {String} storeId                 Store Id
 * @param    {String} accessToken             Access Token
 * @param    {Object} buyerData               Buyer data
 * @param    {String} abandonedCartId         Abandoned Cart Id
 * @return   {Object}                         Returns success and data object
 */
exports.createBuyer = (storeId, accessToken, buyerData, abandonedCartId) => {
    const data = {
        method: 'post',
        url: `/stores/${storeId}/buyers/`,
        accessToken: accessToken,
        body: buyerData
    };

    return zbooniPromise(data)
        .then(zbooniBuyer => {
            if (zbooniBuyer?.id) {
                let emailOrPhone = 'nil';
                if (buyerData?.email_addresses && buyerData?.email_addresses[0].address) {
                    emailOrPhone = buyerData.email_addresses[0].address;
                } else if (buyerData?.phone_numbers && buyerData?.phone_numbers[0].phone_number) {
                    emailOrPhone = buyerData?.phone_numbers[0].phone_number;
                }

                const buyer = {
                    store_id: storeId,
                    email: `'${emailOrPhone}'`,
                    abandoned_cart_id: `'${abandonedCartId}'`,
                    url: `'${zbooniBuyer.url}'`
                };
                return buyerService.upsertBuyer(buyer)
                    .then(dbBuyer => {
                        if (dbBuyer) {
                            return { success: true, data: { url: zbooniBuyer.url } }
                        } else {
                            console.log('Unknown error to create buyer in db.')
                            return { success: false, message: 'Unknown error to create buyer in db.', error: 'Unknown error' }
                        }
                    }).catch(exc => {
                        if (enable_exception_log == 1)
                            console.log('Exception to create buyer in db. Exception: ', exc.message)
                        return { success: false, message: 'Exception to create buyer in db. Exception:', error: exc.message }
                    })
            } else {
                return { success: false, message: 'Failed to create buyer', error: 'Unknown error' }
            }
        }).catch(exc => {
            return { success: false, message: '', error: JSON.stringify(exc.response.data, undefined, 4) }
        })
}
