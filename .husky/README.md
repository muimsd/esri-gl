# Git Hooks Setup

This project uses [Husky](https://typicode.github.io/husky/) to manage Git hooks and ensure code quality before commits.

## Pre-commit Hook

The pre-commit hook automatically runs before each commit to ensure code quality:

### What it does:

1. **Format & Lint Staged Files** (via `lint-staged`)
   - Runs `prettier --write` on staged `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, and `.md` files
   - Runs `eslint --fix` on staged `.ts`, `.tsx`, `.js`, and `.jsx` files
   
2. **Run Tests**
   - Executes the full test suite via `npm run test`

### Configuration

The lint-staged configuration is defined in `package.json`:

```json
"lint-staged": {
  "src/**/*.{ts,tsx,js,jsx}": [
    "prettier --write",
    "eslint --fix"
  ],
  "src/**/*.{css,md}": [
    "prettier --write"
  ]
}
```

### Skipping Hooks (Not Recommended)

If you absolutely need to skip the pre-commit hook (not recommended), you can use:

```bash
git commit --no-verify -m "your message"
```

However, this should only be used in exceptional circumstances, as the hooks are in place to maintain code quality and prevent broken code from being committed.

## Manual Validation

You can manually run the same checks at any time:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm run test

# Run all validation checks
npm run validate
```

## Setup for New Contributors

Husky is automatically installed when running `npm install` thanks to the `prepare` script in `package.json`. No additional setup is required.
