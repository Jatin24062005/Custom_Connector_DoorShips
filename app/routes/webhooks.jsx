import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  switch (topic) {
    case "customers/data_request":
      console.log("Data request", payload);
      break;

    case "customers/redact":
      console.log("Customer redact", payload);
      break;

    case "shop/redact":
      console.log("Shop redact", payload);
      break;

    default:
      return new Response("Unhandled topic", { status: 404 });
  }

  return new Response(null, { status: 200 });
};