/**
 * Calculates Magic Math value for a given number
 * magic_math(0) = 0
 * magic_math(1) = 1
 * magic_math(N) = magic_math(N−1) + magic_math(N−2) + N
 */
export const magicMath = (n: number): number => {
  if (n === 0) return 0;
  if (n === 1) return 1;
  
  // Recursive case: magicMath(N) = magicMath(N−1) + magicMath(N−2) + N
  return magicMath(n - 1) + magicMath(n - 2) + n;
}; 