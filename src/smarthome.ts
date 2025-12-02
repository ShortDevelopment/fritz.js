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
import { enumerable } from "./utils.ts";

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

/**
 * Retrieves a specific Smart Home device by its actor ID.
 * @param client The FritzClient instance.
 * @param actorId The actor ID of the device.
 * @returns The SmartHomeDevice instance for the specified actor ID.
 */
export const smartDevice = async (
  client: FritzClient,
  actorId: string,
): Promise<SmartHomeDevice> => {
  const response = await client.request(Devices.Info, {
    switchcmd: "getdeviceinfos",
    ain: actorId,
  }).then((x) => x.data());

  if (!("device" in response)) {
    throw new Error(
      `Device with actor ID ${actorId} not found`,
    );
  }

  return new SmartHomeDevice(client, response.device);
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
export type HsvColor = {
  /**
   * Hue between 0 and 359 degrees
   */
  readonly hue: number;
  /**
   * Saturation between 0 and 255
   */
  readonly saturation: number;
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
class SmartHomeDevice {
  #client: FritzClient;
  #lastState: DeviceInfo;
  constructor(
    client: FritzClient,
    info: DeviceInfo,
  ) {
    this.#client = client;
    this.#lastState = info;
  }

  /**
   * The unique actor ID of the device.
   */
  @enumerable
  get actorId(): string {
    return this.#lastState["@identifier"];
  }

  /**
   * The name of the device.
   */
  @enumerable
  get name(): string {
    return this.#lastState.name;
  }

  /**
   * The product name of the device.
   */
  @enumerable
  get productName(): string {
    return this.#lastState["@productname"];
  }

  /**
   * The manufacturer of the device.
   */
  @enumerable
  get manufacturer(): string {
    return this.#lastState["@manufacturer"];
  }

  /**
   * A bitmask representing the device's supported functions.
   */
  @enumerable
  get features(): DeviceFunctionBitmask {
    return this.#lastState["@functionbitmask"];
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
   * The last known state of the device.
   * This state may be outdated but is always available.
   * @return The SmartHomeDeviceState instance.
   * @see refreshState() to get the latest state from the Fritz!Box.
   */
  @enumerable
  get lastState(): SmartHomeDeviceState {
    return new SmartHomeDeviceState(this.#lastState);
  }

  /**
   * Refreshes the current state of the device from the Fritz!Box.
   * @returns The updated SmartHomeDeviceState instance.
   */
  async refreshState(): Promise<SmartHomeDeviceState> {
    const response = await this.#client.request(Devices.Info, {
      switchcmd: "getdeviceinfos",
      ain: this.actorId,
    }).then((x) => x.data());

    if (!("device" in response)) {
      throw new Error(
        "Failed to refresh device state: No device info returned",
      );
    }

    return new SmartHomeDeviceState(this.#lastState = response.device);
  }

  /**
   * Turns the device on.
   */
  async turnOn(): Promise<void> {
    if (!this.supportsFeature(DeviceFunctionBitmask.SupportsOnOff)) {
      throw new Error("Device does not support On/Off");
    }

    await this.#client.request(Devices.SetOnOff, {
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

    await this.#client.request(Devices.SetOnOff, {
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

    await this.#client.request(Devices.SetLevel, {
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

    await this.#client.request(Devices.SetLevelPercentage, {
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

      await this.#client.request(Devices.SetColorTemperature, {
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

      await this.#client.request(Devices.SetColorUnmapped, {
        ain: this.actorId,
        switchcmd: "setunmappedcolor",
        hue,
        saturation,
        duration: 0,
      }).then((x) => x.data());
    }
  }
}

/**
 * Represents the current state of a Smart Home device.
 */
class SmartHomeDeviceState {
  readonly timestamp: number = Date.now();

  readonly #state: DeviceInfo;
  constructor(
    state: DeviceInfo,
  ) {
    this.#state = state;
  }

  /**
   * Indicates whether the device is currently connected to the Fritz!Box.
   * @return `true` if present, `false` if not present, or `undefined` if the state is unknown.
   */
  @enumerable
  get isPresent(): boolean | undefined {
    switch (this.#state.present) {
      case "1":
        return true;
      case "0":
        return false;
      default:
        return undefined;
    }
  }

  /**
   * The current battery level of the device.
   * @returns The battery level between 0 and 100, or `undefined` if the state is unknown.
   */
  @enumerable
  get batteryLevel(): number | undefined {
    const battery = this.#state.battery;
    if (!battery || isNaN(battery)) {
      return undefined;
    }
    return battery;
  }

  /**
   * Indicates whether the device has a low battery.
   * @returns `true` if low battery, `false` if battery is okay, or `undefined` if the state is unknown.
   */
  @enumerable
  get hasLowBattery(): boolean | undefined {
    switch (this.#state.batterylow) {
      case "1":
        return true;
      case "0":
        return false;
      default:
        return undefined;
    }
  }

  /**
   * Indicates whether the device is currently on.
   * @returns `true` if on, `false` if off, or `undefined` if the state is unknown.
   */
  @enumerable
  get isOn(): boolean | undefined {
    switch (this.#state.simpleonoff?.state) {
      case "1":
        return true;
      case "0":
        return false;
      default:
        return undefined;
    }
  }

  /**
   * The current level of the device.
   * Might be brightness for lights, height for blinds, etc.
   * @returns The level between 0 and 255, or `undefined` if the state is unknown.
   */
  @enumerable
  get level(): number | undefined {
    const level = this.#state.levelcontrol?.level;
    if (!level || isNaN(level)) {
      return undefined;
    }
    return level;
  }

  /**
   * The current level of the device as a percentage.
   * Might be brightness for lights, height for blinds, etc.
   * @returns The level percentage between 0 = 0% and 100 = 100%, or `undefined` if the state is unknown.
   */
  @enumerable
  get levelPercent(): number | undefined {
    const level = this.#state.levelcontrol?.levelpercentage;
    if (!level || isNaN(level)) {
      return undefined;
    }
    return level;
  }

  /**
   * The current color of the device.
   * @returns The color as HsvColor, the color temperature in kelvin, or `undefined` if the state is unknown.
   */
  @enumerable
  get color(): HsvColor | number | undefined {
    const colorControl = this.#state.colorcontrol;
    if (!colorControl) {
      return undefined;
    }

    const mode = colorControl["@current_mode"];
    if (mode === 0x04) { // Color temperature mode
      const temperature = colorControl.temperature;
      return !temperature || isNaN(temperature) ? undefined : temperature;
    }

    if (mode !== 0x01) { // Not color mode
      return undefined;
    }

    const { hue, saturation, unmapped_hue, unmapped_saturation } = colorControl;
    if (unmapped_hue && unmapped_saturation) {
      return {
        hue: unmapped_hue,
        saturation: unmapped_saturation,
      };
    }

    if (!hue || !saturation) {
      return undefined;
    }

    return {
      hue,
      saturation,
    };
  }
}

export type { SmartHomeDevice, SmartHomeDeviceState };
