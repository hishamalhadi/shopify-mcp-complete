import { gql } from "graphql-request";

// ============ PRODUCTS ============

export const GET_PRODUCTS = gql`
  query GetProducts($first: Int!, $query: String, $after: String) {
    products(first: $first, query: $query, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          title
          description
          descriptionHtml
          handle
          status
          vendor
          productType
          createdAt
          updatedAt
          totalInventory
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                sku
                barcode
                inventoryQuantity
                inventoryItem {
                  id
                }
              }
            }
          }
          tags
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_ID = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      description
      descriptionHtml
      handle
      status
      vendor
      productType
      createdAt
      updatedAt
      totalInventory
      priceRangeV2 {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      featuredImage {
        url
        altText
      }
      images(first: 20) {
        edges {
          node {
            id
            url
            altText
          }
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            price
            compareAtPrice
            sku
            barcode
            inventoryQuantity
            inventoryItem {
              id
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
      metafields(first: 50) {
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
      tags
      options {
        id
        name
        values
      }
    }
  }
`;

// ============ ORDERS ============

export const GET_ORDERS = gql`
  query GetOrders($first: Int!, $query: String, $after: String) {
    orders(first: $first, query: $query, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          name
          email
          phone
          createdAt
          updatedAt
          processedAt
          closedAt
          cancelledAt
          cancelReason
          displayFinancialStatus
          displayFulfillmentStatus
          note
          tags
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          subtotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalTaxSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalShippingPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customer {
            id
            email
            firstName
            lastName
          }
          shippingAddress {
            address1
            address2
            city
            province
            country
            zip
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  title
                  sku
                }
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_ORDER_BY_ID = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      name
      email
      phone
      createdAt
      updatedAt
      processedAt
      closedAt
      cancelledAt
      cancelReason
      displayFinancialStatus
      displayFulfillmentStatus
      note
      tags
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalDiscountsSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      customer {
        id
        email
        firstName
        lastName
        phone
      }
      shippingAddress {
        firstName
        lastName
        address1
        address2
        city
        province
        provinceCode
        country
        countryCode
        zip
        phone
      }
      billingAddress {
        firstName
        lastName
        address1
        address2
        city
        province
        country
        zip
      }
      lineItems(first: 100) {
        edges {
          node {
            id
            title
            quantity
            variant {
              id
              title
              sku
              price
            }
            originalUnitPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customAttributes {
              key
              value
            }
          }
        }
      }
      fulfillments {
        id
        status
        createdAt
        trackingInfo {
          company
          number
          url
        }
      }
      transactions(first: 20) {
        id
        kind
        status
        gateway
        amountSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
      customAttributes {
        key
        value
      }
      metafields(first: 20) {
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
    }
  }
`;

// ============ CUSTOMERS ============

export const GET_CUSTOMERS = gql`
  query GetCustomers($first: Int!, $query: String, $after: String) {
    customers(first: $first, query: $query, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          email
          phone
          firstName
          lastName
          displayName
          createdAt
          updatedAt
          note
          tags
          taxExempt
          numberOfOrders
          amountSpent {
            amount
            currencyCode
          }
          defaultAddress {
            address1
            city
            province
            country
            zip
          }
          emailMarketingConsent {
            marketingState
            consentUpdatedAt
          }
        }
      }
    }
  }
`;

export const GET_CUSTOMER_BY_ID = gql`
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      id
      email
      phone
      firstName
      lastName
      displayName
      createdAt
      updatedAt
      note
      tags
      taxExempt
      numberOfOrders
      amountSpent {
        amount
        currencyCode
      }
      defaultAddress {
        id
        address1
        address2
        city
        province
        provinceCode
        country
        countryCode
        zip
        phone
      }
      addresses {
        id
        address1
        address2
        city
        province
        country
        zip
      }
      emailMarketingConsent {
        marketingState
        consentUpdatedAt
      }
      metafields(first: 20) {
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
    }
  }
`;

export const GET_CUSTOMER_ORDERS = gql`
  query GetCustomerOrders($customerId: ID!, $first: Int!, $after: String) {
    customer(id: $customerId) {
      orders(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                }
              }
            }
          }
        }
      }
    }
  }
`;

// ============ INVENTORY ============

export const GET_INVENTORY_LEVELS = gql`
  query GetInventoryLevels($first: Int!, $query: String, $after: String) {
    inventoryItems(first: $first, query: $query, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          sku
          tracked
          inventoryLevels(first: 10) {
            edges {
              node {
                id
                quantities(names: ["available", "on_hand", "committed", "incoming"]) {
                  name
                  quantity
                }
                location {
                  id
                  name
                }
              }
            }
          }
          variant {
            id
            title
            displayName
            product {
              id
              title
            }
          }
        }
      }
    }
  }
`;

export const GET_LOCATIONS = gql`
  query GetLocations($first: Int!, $includeInactive: Boolean) {
    locations(first: $first, includeInactive: $includeInactive) {
      edges {
        node {
          id
          name
          address {
            address1
            address2
            city
            province
            country
            zip
          }
          isActive
          fulfillsOnlineOrders
          hasActiveInventory
        }
      }
    }
  }
`;

// ============ COLLECTIONS ============

export const GET_COLLECTIONS = gql`
  query GetCollections($first: Int!, $query: String, $after: String) {
    collections(first: $first, query: $query, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          title
          handle
          description
          descriptionHtml
          productsCount {
            count
          }
          image {
            url
            altText
          }
          updatedAt
        }
      }
    }
  }
`;

export const GET_COLLECTION_PRODUCTS = gql`
  query GetCollectionProducts($id: ID!, $first: Int!, $after: String) {
    collection(id: $id) {
      id
      title
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
            status
            totalInventory
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            featuredImage {
              url
            }
          }
        }
      }
    }
  }
`;

// ============ DISCOUNTS ============

export const GET_DISCOUNTS = gql`
  query GetDiscounts($first: Int!, $query: String, $after: String) {
    codeDiscountNodes(first: $first, query: $query, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              status
              startsAt
              endsAt
              usageLimit
              asyncUsageCount
              codes(first: 5) {
                edges {
                  node {
                    code
                  }
                }
              }
              customerGets {
                value {
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                  }
                  ... on DiscountPercentage {
                    percentage
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// ============ SHOP ============

export const GET_SHOP_INFO = gql`
  query GetShopInfo {
    shop {
      id
      name
      email
      description
      primaryDomain {
        url
        host
      }
      myshopifyDomain
      plan {
        displayName
        partnerDevelopment
        shopifyPlus
      }
      billingAddress {
        address1
        city
        province
        country
        zip
      }
      currencyCode
      weightUnit
      timezoneAbbreviation
      ianaTimezone
      contactEmail
      orderNumberFormatPrefix
      orderNumberFormatSuffix
    }
  }
`;

// ============ ANALYTICS (ShopifyQL) ============

export const SHOPIFYQL_QUERY = gql`
  query ShopifyQLQuery($query: String!) {
    shopifyqlQuery(query: $query) {
      tableData {
        columns {
          name
          dataType
          displayName
        }
        rows
      }
      parseErrors
    }
  }
`;
