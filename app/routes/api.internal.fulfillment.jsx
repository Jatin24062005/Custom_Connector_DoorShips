import { json } from "@remix-run/node";
import { verifySecret } from "../utils/verifySecret";
import { createFulfillment } from "../services/shopify/Fulfillment.server";

export async function action({ request }) {
console.log("🔥 Internal fulfillment endpoint hit");
  verifySecret(request);

  const body = await request.json();
  const { shop, orderId, company, number, url, notifyCustomer } = body;

  if (!shop || !orderId || !company || !number) {
    return json(
      {
        success: false,
        message: "shop, orderId, company and number are required",
      },
      { status: 400 },
    );
  }

  try {
    const fulfillment = await createFulfillment({
      shop,
      orderId,
      company,
      number,
      url,
      notifyCustomer,
    });

    return json({ success: true, fulfillment });
  } catch (error) {
    console.error("Failed to create Shopify fulfillment:", error);
    return json({ success: false, message: error.message }, { status: 502 });
  }
}