const { once } = require('events');
const { createInterface } = require('readline');
const { Readable } = require('stream');
const { getLastIndex } = require('./common');

class ReadableString extends Readable {
    sent = false;
    str = '';

    constructor(str) {
        super();
        this.str = str;
    }

    _read = () => {
        if (!this.sent) {
            this.push(Buffer.from(this.str));
            this.sent = true
        } else this.push(null)
    }
}

/**
 * Function that Read JSONL data
 * @param    {Object}  bulkData     Data to read
 * @return   {Object}               Return Products after reading JSONL data
 */
exports.readBulkData = bulkData => {
    const rl = createInterface({
        input: new ReadableString(bulkData),
        crlfDelay: Infinity
    });

    const products = [];
    rl.on('line', (item) => {
        item = JSON.parse(item);
        const { id, url } = item;

        const isProduct = id && id.toLowerCase().includes("/product/");
        const isVariant = id && id.toLowerCase().includes("/productvariant/");
        const isImages = !id && url;

        if (isProduct) {
            products.push({ ...item, images: [], variants: [] });
        }
        if (isVariant) {
            products[products.length - 1].variants.push(item);
        }
        if (isImages) {
            products[products.length - 1].images.push(url);
        }
    });

    return once(rl, 'close').then(() => products).catch(error => error);
};

/**
 * Function that Maps data
 * @param    {Object}  item     Item object
 * @return   {Object}           Return object after mapping data
 */
exports.mapProductsData = item => {
    let { id, title, price, image, product } = item;

    id = getLastIndex(product.id);
    if (product.__parentId !== undefined)
        id += "_" + getLastIndex(product.__parentId);

    return {
        id,
        name: product?.title || 'Demo Product',
        description: product?.description || 'Demo Description',
        price_value: product?.totalPriceSet?.presentmentMoney?.amount || 10,
        price_currency: product?.totalPriceSet?.presentmentMoney?.currencyCode || 'AED',
        brand: product?.vendor || 'Demo Brand',
        tags: product?.tags || [2]
    }
};
