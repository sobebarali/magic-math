#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * Post-merge hook that runs after git pull/merge to check for dependency changes
 */

// Define colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * Run a command and return its exit code and output
 */
async function runCommand(
  command: string[],
): Promise<{ exitCode: number; output: string }> {
  console.log(`${colors.blue}Running: ${command.join(" ")}${colors.reset}`);

  const process = new Deno.Command(command[0], {
    args: command.slice(1),
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await process.output();

  return {
    exitCode: code,
    output: new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr),
  };
}

/**
 * Main hook function
 */
async function main() {
  console.log(`${colors.cyan}Running post-merge hook...${colors.reset}`);

  // Check if deno.json was changed in the merge
  const { exitCode, output } = await runCommand([
    "git",
    "diff-tree",
    "-r",
    "--name-only",
    "--no-commit-id",
    "ORIG_HEAD",
    "HEAD",
  ]);

  if (exitCode !== 0) {
    console.error(
      `${colors.red}Failed to check for changes: ${output}${colors.reset}`,
    );
    Deno.exit(1);
  }

  const changedFiles = output.split("\n");

  const dependencyFilesChanged = changedFiles.some((file) =>
    file === "deno.json" || file === "deno.jsonc" || file === "deps.ts" ||
    file === "import_map.json"
  );

  if (dependencyFilesChanged) {
    console.log(
      `${colors.yellow}Dependency configuration changed!${colors.reset}`,
    );
    console.log(`${colors.cyan}Refreshing cache...${colors.reset}`);

    // Reload and cache dependencies
    const { exitCode: cacheExitCode, output: cacheOutput } = await runCommand([
      "deno",
      "cache",
      "--reload",
      "main.ts",
    ]);

    if (cacheExitCode !== 0) {
      console.error(
        `${colors.red}Failed to refresh cache: ${cacheOutput}${colors.reset}`,
      );
      Deno.exit(1);
    }

    console.log(
      `${colors.green}Dependencies refreshed successfully${colors.reset}`,
    );
  } else {
    console.log(`${colors.green}No dependency changes detected${colors.reset}`);
  }
}

// Run the hook
if (import.meta.main) {
  main().catch((err) => {
    console.error(
      `${colors.red}Error in post-merge hook: ${err}${colors.reset}`,
    );
    Deno.exit(1);
  });
}
