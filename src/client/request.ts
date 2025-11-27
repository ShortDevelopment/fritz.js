// deno-lint-ignore-file no-explicit-any
import type * as v from "@valibot/valibot";

/**
 * Base request type for Fritz!Box device.
 */
export type FritzRequest = {
  endpoint: string;
  response: v.BaseSchema<any, any, any>;
};

/**
 * Request type for GET requests.
 */
export type FritzGetRequest = FritzRequest & {
  method?: undefined;
  request?: undefined;
};

/**
 * Request type for GET or POST requests with a body.
 *
 * For GET requests, the body will be appended as query parameters.
 * For POST requests, the body will be sent as form data.
 *
 * @see URLSearchParams
 */
export type FritzRequestWithBody = FritzRequest & {
  method?: "GET" | "POST";
  request: v.ObjectSchema<any, any>;
};
