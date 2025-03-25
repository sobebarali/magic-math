#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Script to install Git hooks for the project
 * This is a Deno equivalent of what Husky does in Node.js
 */

// Import necessary modules
import { join } from "https://deno.land/std@0.216.0/path/mod.ts";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

/**
 * Run command and return results
 */
async function runCommand(
  command: string[],
): Promise<{ success: boolean; output: string }> {
  console.log(`${colors.blue}Running: ${command.join(" ")}${colors.reset}`);

  try {
    const process = new Deno.Command(command[0], {
      args: command.slice(1),
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await process.output();
    const output = new TextDecoder().decode(stdout) +
      new TextDecoder().decode(stderr);

    return {
      success: code === 0,
      output,
    };
  } catch (error: unknown) {
    return {
      success: false,
      output: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Verify that git is installed and we're in a git repo
 */
async function verifyGitRepo(): Promise<boolean> {
  const { success } = await runCommand(["git", "rev-parse", "--git-dir"]);
  return success;
}

/**
 * Create a Git hook script that calls our Deno scripts
 */
function createHookScript(hookName: string, scriptPath: string): string {
  return `#!/bin/sh
#
# ${hookName} hook managed by our custom Deno hooks system
# To disable, delete or rename this file
#

echo "Running ${hookName} hook..."
deno run --allow-run --allow-read "${scriptPath}" "$@"
`;
}

/**
 * Install hooks to the git hooks directory
 */
async function installHooks() {
  if (!await verifyGitRepo()) {
    console.error(`${colors.red}Error: Not a Git repository${colors.reset}`);
    Deno.exit(1);
  }

  // Get Git hooks directory
  const { success: gitDirSuccess, output: gitDir } = await runCommand([
    "git",
    "rev-parse",
    "--git-dir",
  ]);
  if (!gitDirSuccess) {
    console.error(
      `${colors.red}Error: Could not determine Git directory${colors.reset}`,
    );
    Deno.exit(1);
  }

  const hooksDir = join(gitDir.trim(), "hooks");

  // Make sure hooks directory exists
  try {
    await Deno.mkdir(hooksDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      console.error(
        `${colors.red}Error creating hooks directory: ${error}${colors.reset}`,
      );
      Deno.exit(1);
    }
  }

  // Get project root directory
  const projectRoot = Deno.cwd();

  // Get list of hook files in our hooks directory
  try {
    console.log(
      `${colors.cyan}Looking for hooks in ${projectRoot}/hooks${colors.reset}`,
    );
    const entries = [];

    for await (const entry of Deno.readDir(join(projectRoot, "hooks"))) {
      if (
        entry.isFile && entry.name.endsWith(".ts") &&
        entry.name !== "install.ts"
      ) {
        entries.push(entry.name);
      }
    }

    if (entries.length === 0) {
      console.warn(
        `${colors.yellow}Warning: No hook scripts found in hooks directory${colors.reset}`,
      );
    }

    // Install each hook
    console.log(
      `${colors.cyan}Installing hooks: ${entries.join(", ")}${colors.reset}`,
    );

    for (const entry of entries) {
      const hookName = entry.replace(/\.ts$/, "");
      const hookDestination = join(hooksDir, hookName);
      const hookSourceRelativePath = join(projectRoot, "hooks", entry).replace(
        /\\/g,
        "/",
      );

      // Create the hook shell script
      const hookContent = createHookScript(hookName, hookSourceRelativePath);

      // Write hook file
      await Deno.writeTextFile(hookDestination, hookContent);

      // Make hook executable
      const { success: chmodSuccess } = await runCommand([
        "chmod",
        "+x",
        hookDestination,
      ]);

      if (!chmodSuccess) {
        console.error(
          `${colors.yellow}Warning: Failed to make ${hookName} executable${colors.reset}`,
        );
      }

      console.log(`${colors.green}Installed ${hookName} hook${colors.reset}`);
    }

    console.log(
      `${colors.green}All hooks installed successfully!${colors.reset}`,
    );
    console.log(
      `${colors.yellow}Note: You can bypass hooks with --no-verify option${colors.reset}`,
    );
  } catch (error) {
    console.error(
      `${colors.red}Error installing hooks: ${error}${colors.reset}`,
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  installHooks().catch((err) => {
    console.error(`${colors.red}Unhandled error: ${err}${colors.reset}`);
    Deno.exit(1);
  });
}
