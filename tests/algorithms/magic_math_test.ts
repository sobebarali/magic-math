import { assertEquals, assertThrows } from "@std/assert";
import { magicMath } from "../../src/algorithms/magic_math.ts";

Deno.test("magicMath - Base Cases", () => {
  // Test base cases
  assertEquals(magicMath(0), 0, "magicMath(0) should return 0");
  assertEquals(magicMath(1), 1, "magicMath(1) should return 1");
});

Deno.test("magicMath - Recursive Cases", () => {
  // For N=2: magicMath(1) + magicMath(0) + 2 = 1 + 0 + 2 = 3
  assertEquals(magicMath(2), 3, "magicMath(2) should return 3");

  // For N=3: magicMath(2) + magicMath(1) + 3 = 3 + 1 + 3 = 7
  assertEquals(magicMath(3), 7, "magicMath(3) should return 7");

  // For N=4: magicMath(3) + magicMath(2) + 4 = 7 + 3 + 4 = 14
  assertEquals(magicMath(4), 14, "magicMath(4) should return 14");

  // For N=5: magicMath(4) + magicMath(3) + 5 = 14 + 7 + 5 = 26
  assertEquals(magicMath(5), 26, "magicMath(5) should return 26");
});

Deno.test("magicMath - Input Validation", () => {
  // Test negative numbers
  assertThrows(
    () => magicMath(-1),
    Error,
    "Input must be a non-negative integer",
    "Should throw for negative numbers",
  );

  // Test non-integer values
  assertThrows(
    () => magicMath(1.5),
    Error,
    "Input must be a non-negative integer",
    "Should throw for non-integer values",
  );

  // Test NaN
  assertThrows(
    () => magicMath(NaN),
    Error,
    "Input must be a non-negative integer",
    "Should throw for NaN",
  );
});
