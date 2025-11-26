import * as v from "@valibot/valibot";
import type { FritzRequestWithBody } from "../request.ts";

const BaseEndpoint = {
  method: "GET",
  endpoint: "/webservices/homeautoswitch.lua",
} satisfies Partial<FritzRequestWithBody>;

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

const DeviceInfoSchema = v.object({
  "@identifier": v.string(),
  "@id": v.string(),
  "@manufacturer": v.string(),
  "@productname": v.string(),
  present: v.union([v.literal("0"), v.literal("1")]),
  name: v.string(),
});

export type DeviceInfo = v.InferOutput<typeof DeviceInfoSchema>;

export const Devices = {
  List: {
    ...BaseEndpoint,
    request: v.object({
      switchcmd: v.literal("getdevicelistinfos"),
      sid: v.optional(v.string()),
    }),
    response: v.object({
      devicelist: v.object({
        device: v.array(DeviceInfoSchema),
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

export const HomeAutoSwitch = {
  method: "GET",
  endpoint: "/webservices/homeautoswitch.lua",
  request: v.object({
    ain: v.optional(v.string()),
    switchcmd: v.string(),
    param: v.optional(v.string()),
    sid: v.optional(v.string()),
    onoff: v.optional(v.union([v.literal("0"), v.literal("1")])),
    level: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
    hue: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(359))),
    saturation: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(255))),
    temperature: v.optional(
      v.pipe(v.number(), v.minValue(2700), v.maxValue(6500)),
    ),
  }),
  response: v.object({
    status: v.string(),
  }),
} satisfies FritzRequestWithBody;
