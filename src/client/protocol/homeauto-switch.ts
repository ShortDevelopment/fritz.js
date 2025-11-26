import * as v from "@valibot/valibot";
import type { FritzRequestWithBody } from "../request.ts";

const BaseEndpoint: Pick<FritzRequestWithBody, "method" | "endpoint"> = {
  method: "GET",
  endpoint: "/webservices/homeautoswitch.lua",
};

export const Switches = {
  List: {
    ...BaseEndpoint,
    request: v.object({
      switchcmd: v.literal("getswitchlist"),
      sid: v.optional(v.string()),
    }),
    response: v.string(),
  } satisfies FritzRequestWithBody,

  TurnOn: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setswitchon"),
      sid: v.optional(v.string()),
    }),
    response: v.literal("1"),
  } satisfies FritzRequestWithBody,

  TurnOff: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setswitchoff"),
      sid: v.optional(v.string()),
    }),
    response: v.literal("0"),
  } satisfies FritzRequestWithBody,

  Toggle: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setswitchtoggle"),
      sid: v.optional(v.string()),
    }),
    response: v.union([v.literal("0"), v.literal("1")]),
  } satisfies FritzRequestWithBody,

  GetState: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("getswitchstate"),
      sid: v.optional(v.string()),
    }),
    response: v.union([v.literal("0"), v.literal("1"), v.literal("inval")]),
  } satisfies FritzRequestWithBody,

  IsPresent: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("getswitchpresent"),
      sid: v.optional(v.string()),
    }),
    response: v.union([v.literal("0"), v.literal("1")]),
  } satisfies FritzRequestWithBody,
  // Additional commands
};

export const Devices = {
  List: {
    ...BaseEndpoint,
    request: v.object({
      switchcmd: v.literal("getdevicelistinfos"),
      sid: v.optional(v.string()),
    }),
    response: v.object({
      devicelist: v.object({
        device: v.array(v.object({
          "@identifier": v.string(),
          "@id": v.string(),
          "@manufacturer": v.string(),
          "@productname": v.string(),
          present: v.union([v.literal("0"), v.literal("1")]),
          name: v.string(),
        })),
      }),
    }),
  } satisfies FritzRequestWithBody,

  Info: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("getdeviceinfos"),
      sid: v.optional(v.string()),
    }),
    response: v.unknown(),
  } satisfies FritzRequestWithBody,
};
