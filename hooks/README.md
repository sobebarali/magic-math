# Git Hooks for Deno Projects

This directory contains a custom Git hooks implementation for Deno projects,
similar to what Husky provides for Node.js.

## Available Hooks

- **pre-commit**: Runs before each commit to ensure code quality
  - Formats TypeScript files using `deno fmt`
  - Lints TypeScript files using `deno lint`
  - Only checks files that are staged for commit

- **post-merge**: Runs after git pull/merge operations
  - Checks if dependency files have changed
  - Re-caches dependencies if needed

## Installation

The hooks are automatically installed when you run:

```bash
deno task hooks:install
```

Or you can manually install them:

```bash
deno run --allow-read --allow-write --allow-run hooks/install.ts
```

## Adding New Hooks

To add a new Git hook:

1. Create a new TypeScript file in the `hooks/` directory, named after the Git
   hook (e.g., `hooks/pre-push.ts`)

2. Implement your hook logic in the new file

3. Run `deno task hooks:install` to install the new hook

### Example Hook Structure

```typescript
#!/usr/bin/env -S deno run --allow-run --allow-read

/**
 * Description of what this hook does
 */

// Hook implementation
async function main() {
  // Your hook logic goes here
  console.log("Running hook...");
}

// Run the hook
if (import.meta.main) {
  main().catch((err) => {
    console.error(`Error in hook: ${err}`);
    Deno.exit(1);
  });
}
```

## Bypassing Hooks

If you need to bypass the hooks temporarily, use the `--no-verify` flag:

```bash
git commit -m "Your commit message" --no-verify
```

## Uninstalling

To uninstall all hooks, delete them from the `.git/hooks/` directory.
