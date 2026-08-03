// DoorShips API service layer.
// All calls to the DoorShips backend should live here.
// No implementation yet — wiring comes in a later step.

import {api} from "./../lib/api.server"



export async function getStoreStatus(shop) {
  try {
    const { data } = await api.get("/shopify/getStatus", {
      params: {
        shop,
      },
    });
   const status = data.linked
    return data;
  } catch (error) {
    console.error("Failed to fetch store status", error);

    return {
      linked: false,
    };
  }
}

export async function installStore(shop, accessToken) {
  try {
    const {data} = await api.post("/shopify/install",{
      shop,
      accessToken
    })
    return data;
  } catch (error) {
    console.log(error)
    
  }
}
export async function linkStore(shop, email) {
  try {
    const res = await api.post("/shopify/linkStore", {
      shop,
      email,
    });

    console.log("Response:", res);
    console.log("Response Data:", res.data);
    const linkedUser = res.data.store.user

    return linkedUser
    ;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

// export async function getOrders(shop) {}

export async function getDashboardLink(shop) {
    try {
    const res = await api.post("/shopify/generateAuthLink", {
      shop
    });

    console.log("Response:", res);
    console.log("Response Data:", res.data);
    const url = res.data.url

    return url;
    
  } catch (error) {
    console.error(error.response?.data || error.message);
   return null;
  }
}


export async function createShopifyOrder(shop, payload) {
  const response = await api.post("/shopify/webhooks/orders_create", {
      shop,
      order:payload
    });

  if (!response.data) {
    throw new Error("Failed to sync order");
  }

  return response.data;
}

export async function updateShopifyOrder(shop, payload) {
  const response = await api.post("/shopify/webhooks/updateOrder", {
      shop,
      order:payload
    });

  if (!response.data) {
    throw new Error("Failed to sync order");
  }

  return response.data;
}

export async function uninstallStore(shop) {
  const response = await api.post("/shopify/webhooks/uninstall", {
      shop
    });

  if (!response.data) {
    throw new Error("Failed to sync order");
  }

  return response.data;
}



