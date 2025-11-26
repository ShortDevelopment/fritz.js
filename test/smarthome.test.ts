import { auth, UserPassword } from "../src/client/auth/index.ts";
import { FritzClient } from "../src/client/index.ts";
import { listDevices } from "../src/smarthome.ts";
import { baseUrl, password, username } from "./utils.ts";

Deno.test({
  name: "listDevices",
  ignore: baseUrl === undefined,
  async fn() {
    await using client = new FritzClient(baseUrl).use(
      auth(new UserPassword({ username, password })),
    );

    const list = await listDevices(client);
    for (const device of list) {
      console.log(
        `Device: ${device.name} (${device.productName}) by ${device.manufacturer}`,
      );
    }
  },
});
