import { assertEquals, assertThrows } from "@std/assert";
import { magicMathIterative } from "../../src/algorithms/magic_math_iterative.ts";

Deno.test("magicMathIterative - Base Cases", () => {
  // Test base cases
  assertEquals(
    magicMathIterative(0),
    0,
    "magicMathIterative(0) should return 0",
  );
  assertEquals(
    magicMathIterative(1),
    1,
    "magicMathIterative(1) should return 1",
  );
});

Deno.test("magicMathIterative - Calculated Cases", () => {
  // For N=2: magicMath(1) + magicMath(0) + 2 = 1 + 0 + 2 = 3
  assertEquals(
    magicMathIterative(2),
    3,
    "magicMathIterative(2) should return 3",
  );

  // For N=3: magicMath(2) + magicMath(1) + 3 = 3 + 1 + 3 = 7
  assertEquals(
    magicMathIterative(3),
    7,
    "magicMathIterative(3) should return 7",
  );

  // For N=4: magicMath(3) + magicMath(2) + 4 = 7 + 3 + 4 = 14
  assertEquals(
    magicMathIterative(4),
    14,
    "magicMathIterative(4) should return 14",
  );

  // For N=5: magicMath(4) + magicMath(3) + 5 = 14 + 7 + 5 = 26
  assertEquals(
    magicMathIterative(5),
    26,
    "magicMathIterative(5) should return 26",
  );
});

Deno.test("magicMathIterative - Input Validation", () => {
  // Test negative numbers
  assertThrows(
    () => magicMathIterative(-1),
    Error,
    "Input must be a non-negative integer",
    "Should throw for negative numbers",
  );

  // Test non-integer values
  assertThrows(
    () => magicMathIterative(1.5),
    Error,
    "Input must be a non-negative integer",
    "Should throw for non-integer values",
  );

  // Test NaN
  assertThrows(
    () => magicMathIterative(NaN),
    Error,
    "Input must be a non-negative integer",
    "Should throw for NaN",
  );
});

Deno.test("magicMathIterative - Large Numbers", () => {
  // Test with a larger input that might cause stack overflow with recursion
  assertEquals(
    magicMathIterative(1000),
    magicMathIterative(999) + magicMathIterative(998) + 1000,
    "magicMathIterative should handle large inputs",
  );
});
