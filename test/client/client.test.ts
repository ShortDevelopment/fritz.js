import { FritzClient, FritzError } from "../../src/client/index.ts";
import * as v from "@valibot/valibot";
import type { FritzGetRequest } from "../../src/client/request.ts";
import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
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

Deno.test({
  name: "Throw on error works as expected",
  ignore: baseUrl === undefined,
  async fn() {
    await assertRejects(
      async () => {
        await Promise.resolve();
        throw new FritzError("Test error", {
          status: 400,
          statusText: "Bad Request",
          data: null,
        });
      },
      FritzError,
      "Test error",
    );
  },
});
