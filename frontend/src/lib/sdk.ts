import { createApiClient } from "../../../sdk/src/index";
import { API_ORIGIN } from "@/constants/api";
import { coordinatedFetch } from "@/lib/api";

// Generated paths include /api/v1, so the client receives only an origin.
// Keeping fetch coordinated with Axios prevents parallel refresh rotation.
export const sdk = createApiClient(API_ORIGIN, { fetch: coordinatedFetch });
