import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(topic);
  console.log(shop);
  console.log(payload);

  return new Response();
};