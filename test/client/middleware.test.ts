import { FritzClient } from "../../src/client/index.ts";
import * as v from "@valibot/valibot";
import type { FritzGetRequest } from "../../src/client/request.ts";
import { assertEquals } from "@std/assert";

const TestEndpoint = {
  endpoint: "/test",
  response: v.object({
    url: v.string(),
  }),
} satisfies FritzGetRequest;

Deno.test("Request modification", async () => {
  let requestCounter = 0;
  let disposeCounter = 0;

  await using testClient = FritzClient.createTestClient(
    "http://fritz.box",
    (request) => {
      request = new Request(request.url, request);
      return new Response(
        JSON.stringify({
          url: request.url,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  );

  const response0 = await testClient
    .request(TestEndpoint)
    .then((x) => x.data());

  assertEquals(response0.url, "http://fritz.box/test");

  const client1 = testClient
    .use({
      async request(request, next) {
        assertEquals(
          requestCounter++,
          1,
        );

        request.url = new URL(request.url);
        request.url.searchParams.set("testparam", "testvalue");
        return await next(request);
      },
      dispose() {
        assertEquals(
          disposeCounter++,
          1,
        );
      },
    })
    .use({
      async request(request, next) {
        assertEquals(
          requestCounter++,
          0,
        );

        request.url = new URL(request.url);
        request.url.searchParams.set("anotherparam", "anothervalue");
        return await next(request);
      },
      dispose() {
        assertEquals(
          disposeCounter++,
          0,
        );
      },
    });

  const response1 = await client1.request(TestEndpoint).then((x) => x.data());

  assertEquals(
    response1.url,
    "http://fritz.box/test?anotherparam=anothervalue&testparam=testvalue",
  );
});
