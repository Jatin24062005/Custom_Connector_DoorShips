import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

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

  let status = {
    linked: false,
  };

  const email = session.onlineAccessInfo?.associated_user?.email ?? "";

  let dashboardLink = process.env.DASHBOARD_URL || "https://doorships.in/";

  try {
    await installStore(session.shop, session.accessToken);
  } catch (error) {
    console.error("installStore failed:", error);
  }

  try {
    status = await getStoreStatus(session.shop);

    if (status.linked) {
      dashboardLink = await getDashboardLink(session.shop);
    }
  } catch (error) {
    console.error("status/getDashboardLink failed:", error);
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

  try {
    const formData = await request.formData();

    const email = formData.get("email");

    console.log("DoorShips link request:", {
      shop: session.shop,
      email,
    });

    // Validate email
    if (!email || typeof email !== "string" || !email.trim()) {
      return {
        success: false,
        code: "INVALID_EMAIL",
        error: "Please enter a valid DoorShips account email.",
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Call DoorShips backend
    const result = await linkStore(session.shop, normalizedEmail);

    console.log("DoorShips link response:", result);

    // DoorShips returned an expected failure
    if (!result?.success) {
      return {
        success: false,
        code: result?.code || "LINK_FAILED",
        error: result?.message || "Unable to link this DoorShips account.",
      };
    }

    // Successfully linked
    return {
      success: true,
      message: result?.message || "DoorShips account linked successfully.",
    };
  } catch (error) {
    console.error(
      "Failed to link DoorShips account:",
      error?.response?.data || error?.message || error,
    );

    return {
      success: false,
      code: "SERVER_ERROR",
      error: "Unable to connect to DoorShips right now. Please try again.",
    };
  }
}

export default function Index() {
  const { shop, status, url, email } = useLoaderData();

  const actionData = useActionData();

  const navigation = useNavigation();

  const loading = navigation.state === "submitting";

  const handleOpenDashboard = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <s-page heading="DoorShips Connector">
      <s-section>
        <s-card>
          <s-stack gap="base">
            {/* Header */}
            <s-text variant="headingLg">Shopify Store</s-text>

            {/* Shopify Store */}
            <s-paragraph>
              <s-text>Store: </s-text>

              <s-text emphasis="bold">{shop}</s-text>
            </s-paragraph>

            {/* Shopify App Status */}
            <s-paragraph>
              <s-text>Shopify App: </s-text>

              <s-text emphasis="bold">Installed ✅</s-text>
            </s-paragraph>

            {/* DoorShips Connection Status */}
            <s-paragraph>
              <s-text>DoorShips Connection: </s-text>

              <s-text emphasis="bold">
                {status.linked ? "Connected ✅" : "Not Connected"}
              </s-text>
            </s-paragraph>

            {/* ================================= */}
            {/* CONNECTED STATE */}
            {/* ================================= */}

            {status.linked ? (
              <>
                <s-banner tone="success">
                  This Shopify store is connected to your DoorShips account.
                </s-banner>

                <s-button tone="primary" onClick={handleOpenDashboard}>
                  Open DoorShips Dashboard
                </s-button>
              </>
            ) : (
              <>
                {/* ================================= */}
                {/* NOT CONNECTED */}
                {/* ================================= */}

                <s-banner tone="warning">
                  This Shopify store is not linked with a DoorShips account.
                </s-banner>

                {/* ================================= */}
                {/* ERROR MESSAGE */}
                {/* ================================= */}

                {actionData?.error && (
                  <s-banner tone="critical">{actionData.error}</s-banner>
                )}

                {/* ================================= */}
                {/* SUCCESS MESSAGE */}
                {/* ================================= */}

                {actionData?.success && (
                  <s-banner tone="success">
                    {actionData.message ||
                      "DoorShips account linked successfully."}
                  </s-banner>
                )}

                {/* ================================= */}
                {/* LINK FORM */}
                {/* ================================= */}

                <Form method="post">
                  <s-stack gap="base">
                    <s-paragraph>
                      Enter the email address associated with your DoorShips
                      account.
                    </s-paragraph>

                    <s-text-field
                      name="email"
                      label="DoorShips Account Email"
                      type="email"
                      placeholder="Enter your DoorShips email"
                      value={email}
                      required
                    />

                    <s-button
                      tone="primary"
                      type="submit"
                      loading={loading}
                      disabled={loading}
                    >
                      {loading ? "Linking..." : "Link DoorShips Account"}
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

export const headers = (headersArgs) => boundary.headers(headersArgs);
