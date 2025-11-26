import { FritzClient } from "./client/index.ts";
import {
  DeviceInfo,
  Devices,
  HomeAutoSwitch,
} from "./client/protocol/homeauto-switch.ts";

export const listSwitchIds = async (client: FritzClient) => {
  await using response = await client.request(HomeAutoSwitch, {
    switchcmd: "getswitchlist",
  });

  return await response.rawText();
};

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
 * Stores information about a Smart Home device.
 * @example
 * ```ts
 * import { FritzClient } from "./client/index.ts";
 * import { listDevices } from "./smarthome.ts";
 *
 * await using client = new FritzClient("http://fritz.box");
 * const devices = await listDevices(client);
 * for (const device of devices) {
 *  console.log(`Device: ${device.name} (${device.productName}) by ${device.manufacturer}`);
 * }
 * ```
 */
class SmartHomeDevice {
  constructor(
    private readonly client: FritzClient,
    private readonly info: DeviceInfo,
  ) {}

  get actorId() {
    return this.info["@identifier"];
  }

  get name() {
    return this.info.name;
  }

  get productName() {
    return this.info["@productname"];
  }

  get manufacturer() {
    return this.info["@manufacturer"];
  }
}
