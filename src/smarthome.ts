import type { FritzClient } from "./client/index.ts";
import type * as v from "@valibot/valibot";
import { Devices } from "./client/protocol/homeauto-switch.ts";

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

  get actorId(): string {
    return this.info["@identifier"];
  }

  get name(): string {
    return this.info.name;
  }

  get productName(): string {
    return this.info["@productname"];
  }

  get manufacturer(): string {
    return this.info["@manufacturer"];
  }
}
