import { Form, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  getDashboardLink,
  getStoreStatus,
  installStore,
  linkStore,
} from "../services/doorships.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  let status = { linked: false };
  const email =
    session.onlineAccessInfo?.associated_user?.email ?? "";

  let dashboardLink =
    process.env.DASHBOARD_URL || "https://doorships.in/";

  try {
    await installStore(session.shop, session.accessToken);
  } catch (e) {
    console.error("installStore failed", e);
  }

  try {
    status = await getStoreStatus(session.shop);

    if (status.linked) {
      dashboardLink = await getDashboardLink(session.shop);
    }
  } catch (e) {
    console.error(
      "status/getDashboardLink failed",
      e
    );
  }

  return {
    shop: session.shop,
    status,
    email,
    url: dashboardLink,
  };
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const email = formData.get("email");

  if (!email || typeof email !== "string") {
    return {
      success: false,
      error: "Please enter a valid email address.",
    };
  }

  try {
    await linkStore(session.shop, email.trim());

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to link DoorShips account:", error);

    return {
      success: false,
      error: "Failed to link DoorShips account.",
    };
  }
}

export default function Index() {
  const { shop, status, email, url } = useLoaderData();
  const navigation = useNavigation();

  const loading = navigation.state === "submitting";

  const HandleOpenDashboard = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <s-page heading="DoorShips Connector">
      <s-section>
        <s-card>
          <s-stack gap="base">

            <s-text variant="headingLg">
              Shopify Store
            </s-text>

            <s-paragraph>
              <s-text>Store: </s-text>
              <s-text emphasis="bold">
                {shop}
              </s-text>
            </s-paragraph>

            <s-paragraph>
              <s-text>Shopify App: </s-text>
              <s-text emphasis="bold">
                Installed ✅
              </s-text>
            </s-paragraph>

            <s-paragraph>
              <s-text>DoorShips Connection: </s-text>
              <s-text emphasis="bold">
                {status.linked
                  ? "Connected ✅"
                  : "Not Connected"}
              </s-text>
            </s-paragraph>

            {status.linked ? (
              <>
                <s-banner tone="success">
                  This Shopify store is connected to your
                  DoorShips account.
                </s-banner>

                <s-button
                  tone="primary"
                  onClick={HandleOpenDashboard}
                >
                  Open DoorShips Dashboard
                </s-button>
              </>
            ) : (
              <>
                <s-banner tone="warning">
                  This Shopify store is not linked with a
                  DoorShips account.
                </s-banner>

                <Form method="post">
                  <s-stack gap="base">

                    <s-paragraph>
                      Enter the email address associated with
                      your DoorShips account.
                    </s-paragraph>

                    <s-text-field
                      name="email"
                      label="DoorShips Account Email"
                      type="email"
                      value={email}
                      placeholder="Enter your DoorShips email"
                      required
                    />

                    <s-button
                      tone="primary"
                      submit
                      loading={loading}
                    >
                      Link DoorShips Account
                    </s-button>

                  </s-stack>
                </Form>
              </>
            )}

          </s-stack>
        </s-card>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) =>
  boundary.headers(headersArgs);