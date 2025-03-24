/**
 * Returns benchmark data for comparing algorithm performance
 */
export function getBenchmarkData() {
  return {
    message: "Magic Math Benchmark",
    tests: [
      { n: 10, recursive: "0.1ms", iterative: "0.2ms", winner: "recursive" },
      { n: 100, recursive: "0.4ms", iterative: "0.3ms", winner: "iterative" },
      { n: 1000, recursive: "2.5ms", iterative: "1.1ms", winner: "iterative" }
    ]
  };
} 