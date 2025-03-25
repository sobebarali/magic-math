import { magicMath, magicMathIterative } from "../src/algorithms/index.ts";

/**
 * Runs a benchmark comparing different implementations of the Magic Math algorithm
 * @param n The input value to calculate
 * @param runs Number of runs to average time over
 */
export const runBenchmark = async (n: number, runs = 5) => {
  console.log(
    `\n🔍 Benchmarking Magic Math implementations for n=${n} (${runs} runs):\n`,
  );

  // Run recursive (memoized) implementation
  const recursiveResults: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      const result = magicMath(n);
      const end = performance.now();
      recursiveResults.push(end - start);
      console.log(
        `  Run ${i + 1}: Recursive (memoized) - ${
          (end - start).toFixed(2)
        }ms - Result: ${result}`,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.log(
        `  Run ${i + 1}: Recursive (memoized) - Failed: ${errorMessage}`,
      );
    }
    // Short delay between runs
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Run iterative implementation
  const iterativeResults: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      const result = magicMathIterative(n);
      const end = performance.now();
      iterativeResults.push(end - start);
      console.log(
        `  Run ${i + 1}: Iterative - ${
          (end - start).toFixed(2)
        }ms - Result: ${result}`,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.log(`  Run ${i + 1}: Iterative - Failed: ${errorMessage}`);
    }
    // Short delay between runs
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Calculate and display average performance
  const recursiveAvg = recursiveResults.length > 0
    ? recursiveResults.reduce((a, b) => a + b, 0) / recursiveResults.length
    : 0;

  const iterativeAvg = iterativeResults.length > 0
    ? iterativeResults.reduce((a, b) => a + b, 0) / iterativeResults.length
    : 0;

  console.log("\n📊 Results Summary:");
  console.log(`  Recursive (memoized): ${recursiveAvg.toFixed(2)}ms average`);
  console.log(`  Iterative: ${iterativeAvg.toFixed(2)}ms average`);

  // Determine winner
  if (recursiveResults.length === 0) {
    console.log("  🏆 Winner: Iterative (recursive implementation failed)");
  } else if (iterativeResults.length === 0) {
    console.log("  🏆 Winner: Recursive (iterative implementation failed)");
  } else if (recursiveAvg < iterativeAvg) {
    const improvement = ((iterativeAvg - recursiveAvg) / iterativeAvg * 100)
      .toFixed(2);
    console.log(`  🏆 Winner: Recursive (${improvement}% faster)`);
  } else if (iterativeAvg < recursiveAvg) {
    const improvement = ((recursiveAvg - iterativeAvg) / recursiveAvg * 100)
      .toFixed(2);
    console.log(`  🏆 Winner: Iterative (${improvement}% faster)`);
  } else {
    console.log("  🤝 Tie: Both implementations performed equally");
  }
};

// Run benchmark if this module is executed directly
if (import.meta.main) {
  // Parse command line arguments
  const args = Deno.args;
  const n = args.length > 0 ? parseInt(args[0], 10) : 30;
  const runs = args.length > 1 ? parseInt(args[1], 10) : 5;

  // Validate inputs
  if (isNaN(n) || n < 0) {
    console.error("Error: n must be a non-negative integer");
    Deno.exit(1);
  }

  if (isNaN(runs) || runs < 1) {
    console.error("Error: runs must be a positive integer");
    Deno.exit(1);
  }

  console.log("🚀 Magic Math Algorithm Benchmark");
  console.log("================================");

  // Run benchmarks with different values
  await runBenchmark(n, runs);

  // For large values, just compare the iterative implementation
  if (n < 500) {
    console.log("\n⚠️ Testing with larger input (n=500)...");
    await runBenchmark(500, 3);
  }

  console.log("\n✅ Benchmark completed!");
}
