'use strict'

// Shopify Queries
module.exports = {
  getCustomerQuery: (id) => `{\n  customer(id: \"gid://shopify/Customer/${id}\") {\n    id\n    displayName\n    email\n    phone\n  }\n}`,
  getAllCustomersQuery: (limit, offset) => `{\n  customers(first: ${limit}) {\n    edges {\n      node {\n    id\n     displayName\n      }\n    }\n  }\n}\n`,
  getAllProductsQuery: (limit = 10, afterCursor = null, beforeCursor = null) => `
        {
            products(first: ${limit}, after: ${afterCursor}, before: ${beforeCursor}) {
                edges {
                    node {
                        id
                        title
                        description
                        tags
                        vendor
                    }
                }
                pageInfo {
                    endCursor
                    startCursor
                    hasNextPage
                    hasPreviousPage
                }
            }
        }`,
  getShopifyVariantInventoryQuery: (shopifyVariantId) => `
        {
          productVariant (id: "gid://shopify/ProductVariant/${shopifyVariantId}") {
            inventoryItem {
              id
              tracked
            }
            inventoryQuantity
            sellableOnlineQuantity
            inventoryPolicy
            selectedOptions{
              name
              value
            }
          }
        }
    `,
  getCustomerOrderHistoryQuery: (id) => `{\n  customer(id: \"gid://shopify/Customer/${id}\") {\n    id\n    displayName\n    orders(first: 5) {\n      edges {\n        node {\n          id\n          name\n          createdAt\n          totalPriceSet {\n            presentmentMoney {\n              amount\n              currencyCode\n            }\n          }\n        }\n      }\n    }\n  }\n}`,
  getOrderDetailsQuery: (id) => `{\n  order(id: "gid://shopify/Order/${id}") {\n    id\n    name\n    createdAt\n    totalPriceSet {\n      presentmentMoney {\n        amount\n      }\n    }\n  }\n}\n`,
  PRODUCT_BULK_QUERY: `
        mutation {
          bulkOperationRunQuery(
           query: """
            {
              products {
                edges {
                  node {
                    id
                    title
                    description
                    tags
                    vendor
                    images {
                      edges {
                        node {
                          url
                        }
                      }
                    }
                    variants {
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
                          selectedOptions{
                            name
                            value
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
              }
            }
            """
          ) {
            bulkOperation {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }    
    `,
  RETRIEVE_BULK_DATA: (ID) => {
    return `{
          node(id: "${ID}") {
            ... on BulkOperation {
              id
              status
              errorCode
              createdAt
              completedAt
              objectCount
              fileSize
              url
              partialDataUrl
            }
          }
        }`;
  },
  getShopInfo: () => `
        {
          shop {
            currencyCode
            enabledPresentmentCurrencies
            ianaTimezone
          }
        }
    `
};

// mutation {\n  bulkOperationRunQuery(\n   query: \"\"\"\n    {\n      products {\n        edges {\n          node {\n            id\n            title\n          }\n        }\n      }\n    }\n    \"\"\"\n  ) {\n    bulkOperation {\n      id\n      status\n    }\n    userErrors {\n      field\n      message\n    }\n  }\n}\n
