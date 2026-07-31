import { authenticate } from "../shopify.server";
import { createShopifyOrder } from "../services/doorships.server";

export const action = async ({ request }) => {
      console.log("🔥 orders/create webhook received");
  const { shop, payload } = await authenticate.webhook(request);
   console.log("shop : ", shop)
  await createShopifyOrder(shop, payload);

  return new Response(null, { status: 200 });
};