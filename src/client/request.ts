// deno-lint-ignore-file no-explicit-any
import * as v from "@valibot/valibot";

export type FritzRequest = {
  endpoint: string;
  response: v.BaseSchema<any, any, any>;
};

export type FritzGetRequest = FritzRequest & {
  method?: undefined;
  request?: undefined;
};

export type FritzRequestWithBody = FritzRequest & {
  method?: "GET" | "POST";
  request: v.ObjectSchema<any, any>;
};
