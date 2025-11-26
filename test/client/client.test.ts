import { FritzClient } from "../../src/client/index.ts";
import * as v from "@valibot/valibot";
import { FritzGetRequest } from "../../src/client/request.ts";
import { assertEquals, assertNotEquals } from "@std/assert";

const FritzBoxHome = {
  endpoint: "/",
  response: v.string(),
} satisfies FritzGetRequest;

Deno.test("Response body should be cleaned up", async () => {
  await using testClient = new FritzClient("http://fritz.box");
  await using response = await testClient.request(FritzBoxHome);

  assertNotEquals(response, undefined);
});

Deno.test("No exception when response body was accessed", async () => {
  await using testClient = new FritzClient("http://fritz.box");
  await using response = await testClient.request(FritzBoxHome);

  const data = await response.data();

  assertEquals(typeof data, "string");
  assertNotEquals(data, "");
});
