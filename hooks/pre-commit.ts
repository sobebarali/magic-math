#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * Pre-commit hook that runs formatting and linting before commit
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
 * Run a command and return its exit code
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
  console.log(`${colors.cyan}Running pre-commit hook...${colors.reset}`);

  // Get staged files
  const { exitCode: gitExitCode, output: gitOutput } = await runCommand([
    "git",
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACM",
  ]);

  if (gitExitCode !== 0) {
    console.error(
      `${colors.red}Failed to get staged files: ${gitOutput}${colors.reset}`,
    );
    Deno.exit(1);
  }

  const stagedFiles = gitOutput
    .split("\n")
    .filter((file) => file.trim() !== "" && file.endsWith(".ts"));

  if (stagedFiles.length === 0) {
    console.log(`${colors.green}No TypeScript files to check${colors.reset}`);
    Deno.exit(0);
  }

  console.log(
    `${colors.cyan}Found ${stagedFiles.length} TypeScript files to check${colors.reset}`,
  );

  // Run format check
  const { exitCode: formatExitCode, output: formatOutput } = await runCommand([
    "deno",
    "fmt",
    "--check",
    ...stagedFiles,
  ]);

  if (formatExitCode !== 0) {
    console.error(
      `${colors.red}Formatting check failed:${colors.reset}\n${formatOutput}`,
    );
    console.log(
      `${colors.yellow}Please run 'deno fmt' to fix formatting issues${colors.reset}`,
    );
    Deno.exit(1);
  }

  console.log(`${colors.green}Formatting check passed${colors.reset}`);

  // Run lint check
  const { exitCode: lintExitCode, output: lintOutput } = await runCommand([
    "deno",
    "lint",
    ...stagedFiles,
  ]);

  if (lintExitCode !== 0) {
    console.error(
      `${colors.red}Linting check failed:${colors.reset}\n${lintOutput}`,
    );
    console.log(
      `${colors.yellow}Please fix linting issues before committing${colors.reset}`,
    );
    Deno.exit(1);
  }

  console.log(`${colors.green}Linting check passed${colors.reset}`);

  // Optional: Run tests
  // const { exitCode: testExitCode, output: testOutput } = await runCommand(["deno", "test", "--allow-net", "--allow-env"]);

  // if (testExitCode !== 0) {
  //   console.error(`${colors.red}Tests failed:${colors.reset}\n${testOutput}`);
  //   console.log(`${colors.yellow}Please fix failing tests before committing${colors.reset}`);
  //   Deno.exit(1);
  // }

  // console.log(`${colors.green}All tests passed${colors.reset}`);

  console.log(
    `${colors.green}All checks passed, proceeding with commit${colors.reset}`,
  );
}

// Run the hook
if (import.meta.main) {
  main().catch((err) => {
    console.error(
      `${colors.red}Error in pre-commit hook: ${err}${colors.reset}`,
    );
    Deno.exit(1);
  });
}
