#!/bin/bash

# Script to publish redirect packages for NPM name reservation
# This reserves the package names and redirects traffic to esri-gl

echo "🚀 Publishing NPM redirect packages..."

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Please login to npm first: npm login"
    exit 1
fi

echo "📦 Publishing esri-mapbox-gl redirect package..."
cd packages/esri-mapbox-gl
npm publish --access=public
cd ../..

echo "📦 Publishing esri-maplibre-gl redirect package..."
cd packages/esri-maplibre-gl
npm publish --access=public
cd ../..

echo "✅ All redirect packages published successfully!"
echo ""
echo "Reserved package names:"
echo "  - esri-gl (main package)"
echo "  - esri-mapbox-gl (redirect to esri-gl)"
echo "  - esri-maplibre-gl (redirect to esri-gl)"
echo ""
echo "Users who install the redirect packages will see deprecation warnings"
echo "and be directed to use 'esri-gl' instead."
