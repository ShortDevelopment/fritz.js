import { auth, UserPassword } from "../src/client/auth/index.ts";
import { FritzClient } from "../src/client/index.ts";
import { listDevices } from "../src/smarthome.ts";
import { password, username } from "./utils.ts";

await using client = new FritzClient("http://fritz.box").use(
  auth(new UserPassword({ username, password })),
);

Deno.test("listDevices", async () => {
  const list = await listDevices(client);
  for (const device of list) {
    console.log(
      `Device: ${device.name} (${device.productName}) by ${device.manufacturer}`,
    );
  }
});
