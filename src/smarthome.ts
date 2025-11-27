/**
 * Module for managing Smart Home devices connected to a Fritz!Box.
 *
 * @example
 * ```ts
 * import { FritzClient } from "@shortdev/fritz";
 * import { listDevices } from "@shortdev/fritz/smarthome";
 *
 * await using client = new FritzClient("http://fritz.box");
 * const devices = await listDevices(client);
 * for (const device of devices) {
 *  console.log(`Device: ${device.name} (${device.productName}) by ${device.manufacturer}`);
 *
 *  if (device.supportsFeature(DeviceFunctionBitmask.SupportsOnOff)) {
 *    await device.turnOn();
 *    console.log("  Turned on");
 *  }
 * }
 * ```
 *
 * @module
 */

import type { FritzClient } from "./client/index.ts";
import type * as v from "@valibot/valibot";
import { Devices } from "./client/protocol/homeauto-switch.ts";

/**
 * Lists all Smart Home devices known to the Fritz!Box.
 * @param client The FritzClient instance.
 * @returns Array of all known SmartHomeDevice instances.
 */
export const listDevices = async (
  client: FritzClient,
): Promise<SmartHomeDevice[]> => {
  const response = await client.request(Devices.List, {
    switchcmd: "getdevicelistinfos",
  }).then((x) => x.data());

  return response.devicelist.device.map((info) =>
    new SmartHomeDevice(client, info)
  );
};

type DeviceInfo = v.InferOutput<
  typeof Devices.List.response
>["devicelist"]["device"][number];

/**
 * Bitmask flags for device functions.
 */
export enum DeviceFunctionBitmask {
  HanFunDevice = 1 << 0,
  Light = 1 << 2,
  AlarmSensor = 1 << 4,
  FritzButton = 1 << 5,
  FritzRadiator = 1 << 6,
  FritzEnergyMeter = 1 << 7,
  TemperatureSensor = 1 << 8,
  FritzSwitch = 1 << 9,
  FritzDectRepeater = 1 << 10,
  FritzMicrophone = 1 << 11,
  HanFunUnit = 1 << 13,
  SupportsOnOff = 1 << 15,
  SupportsLevel = 1 << 16,
  SupportsColor = 1 << 17,
  Blind = 1 << 18,
  HumiditySensor = 1 << 20,
}

/**
 * Represents a color in HSV format.
 */
type HsvColor = {
  /**
   * Hue between 0 and 359 degrees
   */
  hue: number;
  /**
   * Saturation between 0 and 255
   */
  saturation: number;
};

/**
 * Stores information about a Smart Home device.
 * @example
 * ```ts
 * import { FritzClient } from "@shortdev/fritz";
 * import { listDevices } from "@shortdev/fritz/smarthome";
 *
 * await using client = new FritzClient("http://fritz.box");
 * const devices = await listDevices(client);
 * for (const device of devices) {
 *  console.log(`Device: ${device.name} (${device.productName}) by ${device.manufacturer}`);
 * }
 * ```
 */
export class SmartHomeDevice {
  constructor(
    private readonly client: FritzClient,
    private readonly info: DeviceInfo,
  ) {}

  /**
   * The unique actor ID of the device.
   */
  get actorId(): string {
    return this.info["@identifier"];
  }

  /**
   * The name of the device.
   */
  get name(): string {
    return this.info.name;
  }

  /**
   * The product name of the device.
   */
  get productName(): string {
    return this.info["@productname"];
  }

  /**
   * The manufacturer of the device.
   */
  get manufacturer(): string {
    return this.info["@manufacturer"];
  }

  /**
   * A bitmask representing the device's supported functions.
   */
  get features(): DeviceFunctionBitmask {
    return parseInt(this.info["@functionbitmask"], 10);
  }

  /**
   * Checks if the device supports a specific feature.
   * @param feature The feature to check.
   * @returns True if the device supports the feature, false otherwise.
   */
  supportsFeature(feature: DeviceFunctionBitmask): boolean {
    return (this.features & feature) === feature;
  }

  /**
   * Turns the device on.
   */
  async turnOn(): Promise<void> {
    if (!this.supportsFeature(DeviceFunctionBitmask.SupportsOnOff)) {
      throw new Error("Device does not support On/Off");
    }

    await this.client.request(Devices.SetOnOff, {
      ain: this.actorId,
      switchcmd: "setsimpleonoff",
      onoff: "1",
    }).then((x) => x.data());
  }

  /**
   * Turns the device off.
   */
  async turnOff(): Promise<void> {
    if (!this.supportsFeature(DeviceFunctionBitmask.SupportsOnOff)) {
      throw new Error("Device does not support On/Off");
    }

    await this.client.request(Devices.SetOnOff, {
      ain: this.actorId,
      switchcmd: "setsimpleonoff",
      onoff: "0",
    }).then((x) => x.data());
  }

  /**
   * Sets the level of the device.
   * Might be brightness for lights, height for blinds, etc.
   * @param level The level to set, between 0 and 255.
   */
  async setLevel(level: number): Promise<void> {
    if (!this.supportsFeature(DeviceFunctionBitmask.SupportsLevel)) {
      throw new Error("Device does not support Level");
    }

    if (level < 0 || level > 255) {
      throw new Error("Level must be between 0 and 255");
    }

    await this.client.request(Devices.SetLevel, {
      ain: this.actorId,
      switchcmd: "setlevel",
      level,
    }).then((x) => x.data());
  }

  /**
   * Sets the level of the device as a percentage.
   * @param percent The level percentage to set, between 0 = 0% and 100 = 100%.
   */
  async setLevelPercent(percent: number): Promise<void> {
    if (!this.supportsFeature(DeviceFunctionBitmask.SupportsLevel)) {
      throw new Error("Device does not support Level");
    }

    if (percent < 0 || percent > 100) {
      throw new Error("Percent must be between 0 and 100");
    }

    await this.client.request(Devices.SetLevelPercentage, {
      ain: this.actorId,
      switchcmd: "setlevelpercentage",
      level: percent,
    }).then((x) => x.data());
  }

  /**
   * Sets the color of the device freely.
   */
  async setColor(color: HsvColor): Promise<void>;

  /**
   * Sets the color temperature of the device.
   * @param temperature The color temperature to set, between 2700 and 6500 kelvin.
   */
  async setColor(temperature: number): Promise<void>;

  async setColor(colorOrTemperature: HsvColor | number): Promise<void> {
    if (!this.supportsFeature(DeviceFunctionBitmask.SupportsColor)) {
      throw new Error("Device does not support Color");
    }

    if (typeof colorOrTemperature === "number") {
      // Set by temperature in kelvin
      const temperature = colorOrTemperature;

      if (temperature < 2700 || temperature > 6500) {
        throw new Error("Temperature must be between 2700 and 6500");
      }

      await this.client.request(Devices.SetColorTemperature, {
        ain: this.actorId,
        switchcmd: "setcolortemperature",
        temperature,
        duration: 0,
      }).then((x) => x.data());
    } else {
      // Set by hue/saturation
      const { hue, saturation } = colorOrTemperature;

      if (hue < 0 || hue > 359) {
        throw new Error("Hue must be between 0 and 359");
      }
      if (saturation < 0 || saturation > 255) {
        throw new Error("Saturation must be between 0 and 255");
      }

      await this.client.request(Devices.SetColorUnmapped, {
        ain: this.actorId,
        switchcmd: "setunmappedcolor",
        hue,
        saturation,
        duration: 0,
      }).then((x) => x.data());
    }
  }
}
