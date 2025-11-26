import { UserPassword } from "../../src/client/auth/user-password.ts";
import { FritzClient } from "../../src/client/index.ts";
import { password, username } from "../utils.ts";
import { assertEquals, assertNotEquals } from "@std/assert";

Deno.test("Challenge handling V1", async () => {
  const challenge = "1234567z";
  const password = "äbc";

  const response = await UserPassword.handleChallenge(challenge, password);

  assertEquals(response, "1234567z-9e224a41eeefa284df7bb0f26c2913e2");
});

Deno.test("Challenge handling V2", async () => {
  const challenge = "2$10000$5A1711$2000$5A1722";
  const password = "1example!";

  const response = await UserPassword.handleChallenge(challenge, password);

  assertEquals(
    response,
    "5A1722$1798a1672bca7c6463d6b245f82b53703b0f50813401b03e4045a5861e689adb",
  );
});

Deno.test("UserNamePasswordAuth login", async () => {
  await using client = new FritzClient("http://fritz.box");
  const auth = new UserPassword({ username, password });

  const session = await auth.login(client);
  console.log({ session });
  assertNotEquals(session.sid.replaceAll("0", ""), "");

  await auth.logout(client, session);
});
