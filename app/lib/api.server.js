// Shared fetch/axios helper for calling the DoorShips backend.
// Left empty for now — doorships.server.js will import from here
// once the actual API calls are implemented.

// app/lib/api.server.js

import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});