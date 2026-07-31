import { authenticate } from "../shopify.server";
import { updateShopifyOrder } from "../services/doorships.server";

export const action = async ({ request }) => {
  const { shop, payload } = await authenticate.webhook(request);
   console.log("shop : ", shop)
  await updateShopifyOrder(shop, payload);

  return new Response(null, { status: 200 });
};