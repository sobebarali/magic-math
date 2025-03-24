// Cache to store already calculated magic math values
const memo: Record<number, number> = {};

/**
 * Calculates Magic Math value for a given number
 * magic_math(0) = 0
 * magic_math(1) = 1
 * magic_math(N) = magic_math(N−1) + magic_math(N−2) + N
 */
export const magicMath = (n: number): number => {
  // Input validation
  if (n < 0 || !Number.isInteger(n) || Number.isNaN(n)) {
    throw new Error("Input must be a non-negative integer");
  }

  // Check if result is already memoized
  if (memo[n] !== undefined) {
    return memo[n];
  }

  // Base cases
  if (n === 0) return 0;
  if (n === 1) return 1;
  
  // Recursive case with memoization
  const result = magicMath(n - 1) + magicMath(n - 2) + n;
  memo[n] = result;
  return result;
}; 