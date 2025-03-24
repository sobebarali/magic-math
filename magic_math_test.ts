import { assertEquals } from "@std/assert";
import { magicMath } from "./magic_math.ts";

Deno.test("magicMath - Base Cases", () => {
  // Test base cases
  assertEquals(magicMath(0), 0, "magicMath(0) should return 0");
  assertEquals(magicMath(1), 1, "magicMath(1) should return 1");
}); 