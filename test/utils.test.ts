import { assertEquals } from "@std/assert";
import { enumerable } from "../src/utils.ts";

Deno.test("enumerable decorator", () => {
  class Test {
    @enumerable
    get prop(): string {
      return "value";
    }

    get nonEnumProp(): string {
      return "non-enum-value";
    }
  }

  const instance = new Test();
  assertEquals({ ...instance }, { prop: "value" });
});

Deno.test("enumerable decorator keeps getter functionality", () => {
  class Test {
    private _value: string = "initial";
    @enumerable
    get prop(): string {
      return this._value;
    }
    set prop(val: string) {
      this._value = val;
    }
  }

  const instance = new Test();
  assertEquals(instance.prop, "initial");
  instance.prop = "updated";
  assertEquals(instance.prop, "updated");
});
