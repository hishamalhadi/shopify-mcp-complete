import { gql } from "graphql-request";

// ============ PRODUCTS ============

export const CREATE_PRODUCT = gql`
  mutation ProductCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
        status
        variants(first: 10) {
          edges {
            node {
              id
              title
              price
              sku
              inventoryQuantity
              inventoryItem {
                id
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation ProductUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        handle
        status
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation ProductDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_PRODUCT_VARIANTS = gql`
  mutation ProductVariantsBulkCreate(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      productVariants {
        id
        title
        price
        sku
        inventoryQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_PRODUCT_VARIANTS = gql`
  mutation ProductVariantsBulkUpdate(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        title
        price
        sku
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_PRODUCT_VARIANTS = gql`
  mutation ProductVariantsBulkDelete(
    $productId: ID!
    $variantsIds: [ID!]!
  ) {
    productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
      product {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_PRODUCT_MEDIA = gql`
  mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        ... on MediaImage {
          id
          image {
            url
          }
        }
      }
      mediaUserErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_PRODUCT_MEDIA = gql`
  mutation ProductDeleteMedia($productId: ID!, $mediaIds: [ID!]!) {
    productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
      deletedMediaIds
      mediaUserErrors {
        field
        message
      }
    }
  }
`;

export const SET_METAFIELDS = gql`
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_METAFIELD = gql`
  mutation MetafieldDelete($input: MetafieldDeleteInput!) {
    metafieldDelete(input: $input) {
      deletedId
      userErrors {
        field
        message
      }
    }
  }
`;

// ============ ORDERS ============

export const UPDATE_ORDER = gql`
  mutation OrderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
        name
        note
        tags
        email
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CANCEL_ORDER = gql`
  mutation OrderCancel(
    $orderId: ID!
    $reason: OrderCancelReason!
    $notifyCustomer: Boolean
    $refund: Boolean
    $restock: Boolean
  ) {
    orderCancel(
      orderId: $orderId
      reason: $reason
      notifyCustomer: $notifyCustomer
      refund: $refund
      restock: $restock
    ) {
      job {
        id
        done
      }
      orderCancelUserErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_DRAFT_ORDER = gql`
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        email
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 50) {
          edges {
            node {
              id
              title
              quantity
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const COMPLETE_DRAFT_ORDER = gql`
  mutation DraftOrderComplete($id: ID!, $paymentPending: Boolean) {
    draftOrderComplete(id: $id, paymentPending: $paymentPending) {
      draftOrder {
        id
        order {
          id
          name
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_FULFILLMENT = gql`
  mutation FulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
    fulfillmentCreateV2(fulfillment: $fulfillment) {
      fulfillment {
        id
        status
        createdAt
        trackingInfo {
          company
          number
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ============ CUSTOMERS ============

export const CREATE_CUSTOMER = gql`
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        phone
        note
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation CustomerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        phone
        note
        tags
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation CustomerDelete($input: CustomerDeleteInput!) {
    customerDelete(input: $input) {
      deletedCustomerId
      userErrors {
        field
        message
      }
    }
  }
`;

// ============ INVENTORY ============

export const ADJUST_INVENTORY_QUANTITIES = gql`
  mutation InventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        createdAt
        reason
        changes {
          name
          delta
          quantityAfterChange
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const SET_INVENTORY_QUANTITIES = gql`
  mutation InventorySetOnHandQuantities($input: InventorySetOnHandQuantitiesInput!) {
    inventorySetOnHandQuantities(input: $input) {
      inventoryAdjustmentGroup {
        createdAt
        reason
        changes {
          name
          delta
          quantityAfterChange
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const MOVE_INVENTORY_QUANTITIES = gql`
  mutation InventoryMoveQuantities($input: InventoryMoveQuantitiesInput!) {
    inventoryMoveQuantities(input: $input) {
      inventoryAdjustmentGroup {
        createdAt
        reason
        changes {
          name
          delta
          quantityAfterChange
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ============ DISCOUNTS ============

export const CREATE_DISCOUNT_CODE = gql`
  mutation DiscountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            status
            codes(first: 1) {
              edges {
                node {
                  code
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_DISCOUNT_CODE = gql`
  mutation DiscountCodeBasicUpdate(
    $id: ID!
    $basicCodeDiscount: DiscountCodeBasicInput!
  ) {
    discountCodeBasicUpdate(id: $id, basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            status
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_DISCOUNT_CODE = gql`
  mutation DiscountCodeDelete($id: ID!) {
    discountCodeDelete(id: $id) {
      deletedCodeDiscountId
      userErrors {
        field
        message
      }
    }
  }
`;

// ============ COLLECTIONS ============

export const CREATE_COLLECTION = gql`
  mutation CollectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
        title
        handle
        productsCount {
          count
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_COLLECTION = gql`
  mutation CollectionUpdate($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
        title
        handle
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const ADD_PRODUCTS_TO_COLLECTION = gql`
  mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection {
        id
        productsCount {
          count
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const REMOVE_PRODUCTS_FROM_COLLECTION = gql`
  mutation CollectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
    collectionRemoveProducts(id: $id, productIds: $productIds) {
      userErrors {
        field
        message
      }
    }
  }
`;
