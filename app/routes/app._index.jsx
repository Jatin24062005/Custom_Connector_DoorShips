import { Form, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import {
  getDashboardLink,
  getStoreStatus,
  linkStore,
} from "../services/doorships.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  let status = { linked: false };
  let dashboardLink = process.env.DASHBOARD_URL || "https://doorships.in/";

  try {
    status = await getStoreStatus(session.shop);

    if (!status.linked && session.onlineAccessInfo?.associated_user?.email) {
      await linkStore(
        session.shop,
        session.onlineAccessInfo.associated_user.email,
      );
      status = await getStoreStatus(session.shop);
    }

    if (status.linked) {
      dashboardLink = await getDashboardLink(session.shop);
    }
  } catch (err) {
    console.error("DoorShips backend call failed in app._index loader:", err);
    // fall through with status.linked = false — page still renders
  }

  return {
    shop: session.shop,
    status,
    email: session.onlineAccessInfo?.associated_user?.email,
    url: dashboardLink,
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();

  const email = formData.get("email");

  await linkStore(session.shop, email);

  return { success: true };
}

export default function Index() {
  const { shop, status, email,url } = useLoaderData();
  const navigation = useNavigation();

  const loading = navigation.state === "submitting";

  const HandleOpenDashboard = async () => {
    
    window.open(url,
      "_blank",
      "noopener,noreferrer",
    );
}

  return (
    <s-page heading="DoorShips Connector">
      <s-section>
        <s-card>
          <s-stack gap="base">
            <s-text variant="headingLg">Shopify Store</s-text>

            <s-paragraph>
              <s-text>Store: </s-text>
              <s-text emphasis="bold">{shop}</s-text>
            </s-paragraph>

            <s-paragraph>
              <s-text>Shopify App: </s-text>
              <s-text emphasis="bold">Installed ✅</s-text>
            </s-paragraph>

            <s-paragraph>
              <s-text>DoorShips Connection: </s-text>
              <s-text emphasis="bold">
                {status.linked ? "Connected ✅" : "Not Connected"}
              </s-text>
            </s-paragraph>

            {status.linked ? (
              <>
                {/* <s-paragraph>
                  <s-text>Company: </s-text>
                  <s-text emphasis="bold">
                    {status.user.companyName}
                  </s-text>
                </s-paragraph> */}

                <s-paragraph>
                  <s-text>Email: </s-text>
                  <s-text emphasis="bold">{status.user.email}</s-text>
                </s-paragraph>

                <s-button
                  tone="primary"
                  onClick={HandleOpenDashboard}
                >
                  Open DoorShips Dashboard
                </s-button>
              </>
            ) : (
              <>
                <s-banner tone="info">
                  This Shopify store is not linked with a DoorShips account.
                </s-banner>

                <Form method="post">
                  <input type="hidden" name="email" value={email || ""} />

                  <s-paragraph>
                    Your Shopify account email will be used:
                  </s-paragraph>

                  <s-text emphasis="bold">{email}</s-text>

                  <br />

                  <s-button tone="primary" submit loading={loading}>
                    Link DoorShips Account
                  </s-button>
                </Form>
              </>
            )}
          </s-stack>
        </s-card>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
