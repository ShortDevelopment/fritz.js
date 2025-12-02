import * as v from "@valibot/valibot";
import type { FritzRequestWithBody } from "../request.ts";
import { FritzBool, FritzFalse, FritzTrue } from "./types.ts";

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
    response: FritzTrue,
  } satisfies FritzRequestWithBody,

  TurnOff: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setswitchoff"),
      sid: v.optional(v.string()),
    }),
    response: FritzFalse,
  } satisfies FritzRequestWithBody,

  Toggle: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setswitchtoggle"),
      sid: v.optional(v.string()),
    }),
    response: FritzBool,
  } satisfies FritzRequestWithBody,

  GetState: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("getswitchstate"),
      sid: v.optional(v.string()),
    }),
    response: v.union([FritzFalse, FritzTrue, v.literal("inval")]),
  } satisfies FritzRequestWithBody,

  IsPresent: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("getswitchpresent"),
      sid: v.optional(v.string()),
    }),
    response: FritzBool,
  } satisfies FritzRequestWithBody,
  // Additional commands
};

const deviceResponse = v.object({
  "@identifier": v.string(),
  "@id": v.string(),
  "@manufacturer": v.string(),
  "@productname": v.string(),
  "@functionbitmask": v.pipe(v.string(), v.toNumber()),
  present: FritzBool,
  txbusy: FritzBool,
  name: v.string(),
  batterylow: v.nullish(FritzBool),
  battery: v.optional(
    v.pipe(v.string(), v.toNumber(), v.minValue(0), v.maxValue(100)),
  ),
  switch: v.optional(v.object({
    state: v.nullish(FritzBool),
    mode: v.nullish(v.union([v.literal("auto"), v.literal("manual")])),
    lock: v.nullish(FritzBool),
    devicelock: v.nullish(FritzBool),
  })),
  powermeter: v.optional(v.unknown()),
  temperature: v.optional(v.object({
    celsius: v.nullish(v.pipe(v.string(), v.toNumber())),
    offset: v.nullish(v.pipe(v.string(), v.toNumber())),
  })),
  alert: v.optional(v.unknown()),
  button: v.optional(v.unknown()),
  avmbutton: v.optional(v.unknown()),
  etsiunitinfo: v.optional(v.unknown()),
  simpleonoff: v.optional(v.object({
    state: v.nullish(FritzBool),
  })),
  levelcontrol: v.optional(v.object({
    level: v.nullish(
      v.pipe(v.string(), v.toNumber(), v.minValue(0), v.maxValue(255)),
    ),
    levelpercentage: v.nullish(v.pipe(
      v.string(),
      v.toNumber(),
      v.minValue(0),
      v.maxValue(100),
    )),
  })),
  colorcontrol: v.optional(v.object({
    "@supported_modes": v.pipe(v.string(), v.toNumber()),
    "@current_mode": v.nullish(v.pipe(v.string(), v.toNumber())),
    "@fullcolorsupport": v.nullish(FritzBool),
    "@mapped": v.nullish(FritzBool),
    hue: v.nullish(
      v.pipe(v.string(), v.toNumber(), v.minValue(0), v.maxValue(359)),
    ),
    saturation: v.nullish(
      v.pipe(v.string(), v.toNumber(), v.minValue(0), v.maxValue(255)),
    ),
    unmapped_hue: v.nullish(
      v.pipe(v.string(), v.toNumber(), v.minValue(0), v.maxValue(359)),
    ),
    unmapped_saturation: v.nullish(
      v.pipe(v.string(), v.toNumber(), v.minValue(0), v.maxValue(255)),
    ),
    temperature: v.nullish(
      v.pipe(v.string(), v.toNumber(), v.minValue(2700), v.maxValue(6500)),
    ),
  })),
  blind: v.optional(v.unknown()),
  hkr: v.optional(v.unknown()),
});

export const Devices = {
  List: {
    ...BaseEndpoint,
    request: v.object({
      switchcmd: v.literal("getdevicelistinfos"),
      sid: v.optional(v.string()),
    }),
    response: v.object({
      devicelist: v.object({
        device: v.array(deviceResponse),
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
    response: v.union([
      v.object({ device: deviceResponse }),
      v.object({ group: v.unknown() }),
    ]),
  } satisfies FritzRequestWithBody,

  SetOnOff: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setsimpleonoff"),
      onoff: FritzBool,
      sid: v.optional(v.string()),
    }),
    response: v.unknown(),
  } satisfies FritzRequestWithBody,

  SetLevel: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setlevel"),
      level: v.pipe(v.number(), v.minValue(0), v.maxValue(255)),
      sid: v.optional(v.string()),
    }),
    response: v.unknown(),
  } satisfies FritzRequestWithBody,

  SetLevelPercentage: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setlevelpercentage"),
      level: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
      sid: v.optional(v.string()),
    }),
    response: v.unknown(),
  } satisfies FritzRequestWithBody,

  SetColorUnmapped: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setunmappedcolor"),
      hue: v.pipe(v.number(), v.minValue(0), v.maxValue(359)),
      saturation: v.pipe(v.number(), v.minValue(0), v.maxValue(255)),
      duration: v.pipe(v.number(), v.minValue(0)),
      sid: v.optional(v.string()),
    }),
    response: v.unknown(),
  } satisfies FritzRequestWithBody,

  SetColorTemperature: {
    ...BaseEndpoint,
    request: v.object({
      ain: v.string(),
      switchcmd: v.literal("setcolortemperature"),
      temperature: v.pipe(v.number(), v.minValue(2700), v.maxValue(6500)),
      duration: v.pipe(v.number(), v.minValue(0)),
      sid: v.optional(v.string()),
    }),
    response: v.unknown(),
  } satisfies FritzRequestWithBody,
};
