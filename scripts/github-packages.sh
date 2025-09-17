#!/bin/bash

# GitHub Packages Setup Script
# This script helps configure npm for GitHub Packages publishing and installation

set -e

echo "🚀 GitHub Packages Setup for esri-gl"
echo "======================================="

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup-auth    - Setup authentication for GitHub Packages"
    echo "  configure     - Configure npm registry for @muimsd scope"
    echo "  publish       - Publish current version to GitHub Packages"
    echo "  install       - Install from GitHub Packages"
    echo "  reset         - Reset to default npm registry"
    echo "  help          - Show this help message"
    echo ""
}

# Function to setup authentication
setup_auth() {
    echo "📝 Setting up GitHub Packages authentication..."
    echo ""
    echo "You need a GitHub Personal Access Token with 'write:packages' and 'read:packages' scopes."
    echo "Create one at: https://github.com/settings/tokens/new"
    echo ""
    read -p "Enter your GitHub Personal Access Token: " -s token
    echo ""
    
    if [ -z "$token" ]; then
        echo "❌ Token cannot be empty"
        exit 1
    fi
    
    # Configure npm authentication
    npm config set //npm.pkg.github.com/:_authToken $token
    echo "✅ Authentication configured successfully!"
}

# Function to configure npm registry
configure_registry() {
    echo "🔧 Configuring npm registry for @muimsd scope..."
    npm config set @muimsd:registry https://npm.pkg.github.com/
    echo "✅ Registry configured successfully!"
    echo ""
    echo "Now you can install @muimsd scoped packages from GitHub Packages:"
    echo "  npm install @muimsd/esri-gl"
}

# Function to publish to GitHub Packages
publish_package() {
    echo "📦 Publishing to GitHub Packages..."
    
    # Backup original package.json
    cp package.json package.json.bak
    
    # Update package.json for GitHub Packages
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Add scope if not already present
        if (!pkg.name.startsWith('@')) {
            pkg.name = '@muimsd/' + pkg.name;
        }
        
        // Add publishConfig for GitHub Packages
        pkg.publishConfig = {
            registry: 'https://npm.pkg.github.com/'
        };
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    
    echo "Updated package.json for GitHub Packages:"
    echo "  Name: $(node -p "require('./package.json').name")"
    echo "  Version: $(node -p "require('./package.json').version")"
    
    # Build and publish
    npm run build:prod
    npm publish
    
    # Restore original package.json
    mv package.json.bak package.json
    
    echo "✅ Successfully published to GitHub Packages!"
}

# Function to install from GitHub Packages
install_package() {
    echo "📥 Installing from GitHub Packages..."
    
    # Configure registry if not already configured
    if ! npm config get @muimsd:registry | grep -q "npm.pkg.github.com"; then
        echo "🔧 Configuring registry first..."
        configure_registry
    fi
    
    echo "Available installation options:"
    echo "  npm install @muimsd/esri-gl           # Latest version"
    echo "  npm install @muimsd/esri-gl@alpha     # Alpha version"
    echo "  npm install @muimsd/esri-gl@beta      # Beta version"
    echo ""
    read -p "Enter package version (or press Enter for latest): " version
    
    if [ -z "$version" ]; then
        npm install @muimsd/esri-gl
    else
        npm install @muimsd/esri-gl@$version
    fi
}

# Function to reset configuration
reset_config() {
    echo "🔄 Resetting npm configuration..."
    npm config delete @muimsd:registry 2>/dev/null || true
    npm config delete //npm.pkg.github.com/:_authToken 2>/dev/null || true
    echo "✅ Configuration reset to defaults"
}

# Main script logic
case "${1:-help}" in
    setup-auth)
        setup_auth
        ;;
    configure)
        configure_registry
        ;;
    publish)
        publish_package
        ;;
    install)
        install_package
        ;;
    reset)
        reset_config
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac