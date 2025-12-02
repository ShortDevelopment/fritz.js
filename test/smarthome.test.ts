import { assertRejects } from "@std/assert";
import { auth, UserPassword } from "../src/client/auth/index.ts";
import { FritzClient } from "../src/client/index.ts";
import { listDevices, smartDevice } from "../src/smarthome.ts";
import { actorId, baseUrl, password, username } from "./utils.ts";
import { FritzError } from "@shortdev/fritz";

Deno.test({
  name: "listDevices",
  ignore: baseUrl === undefined,
  async fn() {
    await using client = new FritzClient(baseUrl).use(
      auth(new UserPassword({ username, password })),
    );

    const list = await listDevices(client);
    for (const device of list) {
      console.log({
        device: { ...device },
        lastState: { ...device.lastState },
        currentState: { ...await device.refreshState() },
      });
    }
  },
});

Deno.test({
  name: "existing device by id should succeed",
  ignore: actorId === undefined,
  async fn() {
    await using client = new FritzClient(baseUrl).use(
      auth(new UserPassword({ username, password })),
    );

    const device = await smartDevice(client, actorId);
    console.log({
      device: { ...device },
      lastState: { ...device.lastState },
      currentState: { ...await device.refreshState() },
    });
  },
});

Deno.test({
  name: "non-existing device by id should fail",
  ignore: baseUrl === undefined,
  async fn() {
    await using client = new FritzClient(baseUrl).use(
      auth(new UserPassword({ username, password })),
    );

    const actorId = "99999 9999999";
    await assertRejects(
      async () => await smartDevice(client, actorId),
      FritzError,
      "Request failed with status 400",
    );
  },
});
