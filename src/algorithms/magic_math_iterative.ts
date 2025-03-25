/**
 * Calculates Magic Math value for a given number using an iterative approach
 * This implementation avoids stack overflow for large inputs
 *
 * magic_math(0) = 0
 * magic_math(1) = 1
 * magic_math(N) = magic_math(N−1) + magic_math(N−2) + N
 */
export const magicMathIterative = (n: number): number => {
  // Input validation
  if (n < 0 || !Number.isInteger(n) || Number.isNaN(n)) {
    throw new Error("Input must be a non-negative integer");
  }

  // Base cases
  if (n === 0) return 0;
  if (n === 1) return 1;

  // For n >= 2, use iteration instead of recursion
  let prev = 0; // magicMath(0)
  let current = 1; // magicMath(1)
  let result = 0;

  for (let i = 2; i <= n; i++) {
    // Calculate magicMath(i) = magicMath(i-1) + magicMath(i-2) + i
    result = current + prev + i;

    // Update values for next iteration
    prev = current;
    current = result;
  }

  return result;
};
