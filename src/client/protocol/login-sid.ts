import * as v from "@valibot/valibot";
import type { FritzGetRequest, FritzRequestWithBody } from "../request.ts";

export const RequestSid = {
  endpoint: "/login_sid.lua?version=2",
  response: v.object({
    device: v.object({
      productName: v.optional(v.string()),
      location: v.optional(
        v.object({
          language: v.string(),
          country: v.string(),
        }),
      ),
      fallbackRedirectUrl: v.optional(v.pipe(v.string(), v.url())),
    }),
    sessionInfo: v.object({
      sid: v.string(),
      challenge: v.string(),
      blockTime: v.number(),
      users: v.array(
        v.object({
          user: v.string(),
          last: v.optional(v.literal("1")),
        }),
      ),
    }),
  }),
} satisfies FritzGetRequest;

export const LoginSid = {
  ...RequestSid,
  request: v.object({
    username: v.string(),
    response: v.string(),
  }),
} satisfies FritzRequestWithBody;

export const ValidateSid = {
  ...RequestSid,
  request: v.object({
    sid: v.string(),
  }),
} satisfies FritzRequestWithBody;

export const LogoutSid = {
  ...RequestSid,
  request: v.object({
    logout: v.literal("1"),
    sid: v.string(),
  }),
} satisfies FritzRequestWithBody;
