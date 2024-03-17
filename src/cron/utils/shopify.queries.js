'use strict'

module.exports = {
  getShopifyVariantInventoryQuery: (shopifyVariantId) => `
        {
          productVariant (id: "gid://shopify/ProductVariant/${shopifyVariantId}") {
            inventoryItem {
              id
              tracked
            }
            sellableOnlineQuantity
            price
            inventoryPolicy
          }
        }
    `,
  getProductQuery: (productId) => `
        {
          product(id: "gid://shopify/Product/${productId}") {
            id
            title
            description
            vendor
            totalVariants
            images(first: 50) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  price
                  inventoryQuantity
                  sellableOnlineQuantity
                  inventoryPolicy
                  image {
                    url
                  }
                  inventoryItem {
                    id
                    tracked
                  }
                }
              }
            }
          }
        }
    `,
  getShopInfo: () => `
        {
          shop {
            currencyCode
            ianaTimezone
          }
        }
    `
}