# GitHub Actions Setup for NPM Publishing

This repository includes GitHub Actions workflows for automated publishing to NPM.

## Workflows

### 1. CI Workflow (`ci.yml`)
- **Triggers**: Push to `master`/`main`/`develop`, Pull Requests
- **Purpose**: Run tests, linting, type checking, and build validation
- **Node versions**: Tests on Node 16, 18, and 20

### 2. Publish Alpha (`publish-alpha.yml`)
- **Triggers**: 
  - Push to `alpha` or `develop` branches
  - Manual workflow dispatch
- **Purpose**: Publish alpha/prerelease versions to NPM
- **NPM Tag**: `alpha`
- **Version**: Automatically incremented with `-alpha.X` suffix

### 3. Publish Stable (`publish-stable.yml`)
- **Triggers**:
  - Git tags matching `v*.*.*` pattern
  - Manual workflow dispatch
- **Purpose**: Publish stable releases to NPM
- **NPM Tag**: `latest`

### 4. Publish GitHub Packages (`publish-github-packages.yml`)
- **Triggers**:
  - Push to `master`/`main` branches
  - Git tags matching `v*.*.*` pattern  
  - Manual workflow dispatch
- **Purpose**: Publish to GitHub Packages npm registry
- **Package Name**: `@muimsd/esri-gl` (scoped)
- **Registry**: `https://npm.pkg.github.com/`

## Setup Instructions

### 1. NPM Token (for npmjs.org publishing)
1. Create an NPM access token at https://www.npmjs.com/settings/tokens
2. Go to your GitHub repository → Settings → Secrets and variables → Actions
3. Add a new repository secret named `NPM_TOKEN` with your token value

### 2. GitHub Packages (automatic setup)
- GitHub Packages uses `GITHUB_TOKEN` automatically (no setup required)
- Packages are published as `@muimsd/esri-gl` to GitHub Packages registry
- Users need to configure their npm to use GitHub Packages for `@muimsd` scope
3. Add a new repository secret named `NPM_TOKEN` with your token value

### 2. Publishing Alpha Versions

**Option A: Publish current version as alpha**
```bash
npm run publish:alpha-current  # Publishes v0.1.0-alpha.0 with @alpha tag
```

**Option B: Push to alpha/develop branch**
```bash
git checkout -b alpha
# Make your changes
git commit -m "feat: new alpha feature"
git push origin alpha
```

**Option C: Manual workflow dispatch**
1. Go to Actions tab in GitHub
2. Select "Publish Alpha to NPM" workflow
3. Click "Run workflow"
4. Choose version type (prerelease, prepatch, preminor, premajor)

### 3. Publishing Stable Versions

**Option A: Create a Git tag**
```bash
npm version patch  # or minor/major
git push --tags
```

**Option B: Manual workflow dispatch**
1. Go to Actions tab in GitHub
2. Select "Publish Stable to NPM" workflow
3. Click "Run workflow"
4. Choose version type (patch, minor, major)

### 4. Publishing to GitHub Packages

**Option A: Push to master/main** (automatic)
```bash
git push origin master
```

**Option B: Manual workflow dispatch**
1. Go to Actions tab in GitHub
2. Select "Publish to GitHub Packages" workflow
3. Click "Run workflow"
4. Choose version type and NPM tag

**Option C: Local publishing**
```bash
# Use the helper script
./scripts/github-packages.sh publish

# Or manually
npm run release:github:patch
```

## Installation

### Stable Release (npmjs.org)
```bash
npm install esri-gl
```

### Alpha Release (npmjs.org)
```bash
# Latest alpha (currently v0.1.0-alpha.0)
npm install esri-gl@alpha

# Specific alpha version
npm install esri-gl@0.1.0-alpha.0
```

### GitHub Packages
```bash
# Configure npm for GitHub Packages
npm config set @muimsd:registry https://npm.pkg.github.com/

# Install from GitHub Packages
npm install @muimsd/esri-gl

# Or use the helper script
./scripts/github-packages.sh configure
./scripts/github-packages.sh install
```

## Local Development Scripts

- `npm run release:alpha` - Bump version and publish new alpha version
- `npm run release:beta` - Bump version and publish new beta version  
- `npm run publish:alpha-current` - Publish current version with alpha tag
- `npm run publish:beta-current` - Publish current version with beta tag
- `npm run publish:github` - Publish to GitHub Packages
- `npm run release:github:patch` - Version bump and publish to GitHub Packages
- `npm run release:beta` - Publish beta version locally
- `npm run release:patch` - Publish patch version locally
- `npm run release:minor` - Publish minor version locally
- `npm run release:major` - Publish major version locally

## Workflow Features

- ✅ Automated version bumping
- ✅ Git tag creation
- ✅ GitHub Release creation
- ✅ Full CI validation before publishing
- ✅ Support for both automated and manual publishing
- ✅ Prerelease and stable release channels
- ✅ Multi-Node version testing

## Notes on Dependency Installation

- These workflows use a safe install pattern to avoid failures when no lockfile is present in the repository. Specifically:
  - If `package-lock.json` exists, they run `npm ci` for reproducible installs.
  - If no lockfile is found, they fall back to `npm install`.
- The same conditional logic is applied for `docs/` installs in the CI workflow.
- This ensures CI and publish jobs don't fail with the npm EUSAGE error: "This command requires an existing lockfile" when the project doesn't commit a lockfile.