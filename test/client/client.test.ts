import { FritzClient } from "../../src/client/index.ts";
import * as v from "@valibot/valibot";
import type { FritzGetRequest } from "../../src/client/request.ts";
import { assertEquals, assertNotEquals } from "@std/assert";
import { baseUrl } from "../utils.ts";

const FritzBoxHome = {
  endpoint: "/",
  response: v.string(),
} satisfies FritzGetRequest;

Deno.test({
  name: "Response body should be cleaned up",
  ignore: baseUrl === undefined,
  async fn() {
    await using testClient = new FritzClient(baseUrl);
    await using response = await testClient.request(FritzBoxHome);

    assertNotEquals(response, undefined);
  },
});

Deno.test({
  name: "No exception when response body was accessed",
  ignore: baseUrl === undefined,
  async fn() {
    await using testClient = new FritzClient(baseUrl);
    await using response = await testClient.request(FritzBoxHome);

    const data = await response.data();

    assertEquals(typeof data, "string");
    assertNotEquals(data, "");
  },
});
