import { FritzResponse } from "../../src/client/index.ts";
import * as v from "@valibot/valibot";
import { assert } from "@std/assert";

Deno.test("FritzResponse.rawData should handle xml", async (ctx) => {
  await test("application/xml");
  await test("application/xml; charset=utf-8");
  await test("text/xml");
  await test("text/xml; charset=utf-8");
  await test("Text/XML");
  await test("TEXT/XML; CHARSET=UTF-8");

  async function test(contentType: string) {
    await ctx.step(`Content-Type: ${contentType}`, async () => {
      const response = new Response("<test>data</test>", {
        headers: { "Content-Type": contentType },
      });
      const data = await new FritzResponse(v.any(), response).rawData();
      assert(
        typeof data === "object",
        `Data should be an object but got ${typeof data}`,
      );
    });
  }
});
