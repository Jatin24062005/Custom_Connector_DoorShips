import { unauthenticated } from "../../shopify.server";

const GET_FULFILLMENT_ORDERS_QUERY = `#graphql  
query GetFulfillmentOrders($orderId: ID!) {
  order(id: $orderId) {
    id
    fulfillmentOrders(first: 10) {
      nodes {
        id
        status
        requestStatus
        assignedLocation {
          location {
            id
            name
          }
        }
      }
    }
  }
}
`;

// 1. UPDATED: Changed mutation name to FulfillmentCreateV2 and input type to FulfillmentV2Input
const FULFILLMENT_CREATE_MUTATION = `#graphql
mutation FulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
  fulfillmentCreateV2(fulfillment: $fulfillment) {
    fulfillment {
      id
      status
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

function toOrderGid(orderId) {
  if (String(orderId).startsWith("gid://")) {
    return orderId;
  }
  return `gid://shopify/Order/${orderId}`;
}

export async function createFulfillment({
  shop,
  orderId,
  company,
  number,
  url,
  notifyCustomer = false,
}) {
  const { admin } = await unauthenticated.admin(shop);
  const orderGid = toOrderGid(orderId);

  // ----------------------------
  // Get Fulfillment Orders
  // ----------------------------
  const fulfillmentOrdersResponse = await admin.graphql(
    GET_FULFILLMENT_ORDERS_QUERY,
    {
      variables: {
        orderId: orderGid,
      },
    },
  );

  const fulfillmentOrdersJson = await fulfillmentOrdersResponse.json();
  const order = fulfillmentOrdersJson.data?.order;

  if (!order) {
    throw new Error(`Order not found: ${orderGid}`);
  }

  const fulfillmentOrders = order.fulfillmentOrders.nodes.filter(
    (fo) => fo.status === "OPEN",
  );

  if (!fulfillmentOrders.length) {
    throw new Error("No OPEN fulfillment orders found.");
  }

  // ----------------------------
  // Create Fulfillment (V2)
  // ----------------------------
  const createResponse = await admin.graphql(
    FULFILLMENT_CREATE_MUTATION,
    {
      variables: {
        fulfillment: {
          notifyCustomer,
          trackingInfo: {
            company,
            number,
            url,
          },
          lineItemsByFulfillmentOrder: fulfillmentOrders.map((fo) => ({
            fulfillmentOrderId: fo.id,
          })),
        },
      },
    },
  );

  const createJson = await createResponse.json();

  // 2. UPDATED: Safely parse errors and extract the V2 payload result
  if (createJson.errors) {
    throw new Error(`GraphQL Error: ${JSON.stringify(createJson.errors)}`);
  }

  const result = createJson.data?.fulfillmentCreateV2;

  if (!result) {
    throw new Error("Fulfillment response failed to return data.");
  }

  if (result.userErrors && result.userErrors.length) {
    throw new Error(
      result.userErrors
        .map((e) => e.message)
        .join(", "),
    );
  }

  return result.fulfillment;
}
