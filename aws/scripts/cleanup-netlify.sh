#!/bin/bash

# Cleanup script to remove old Netlify structure after AWS migration
set -e

echo "🧹 Cleaning up old Netlify structure..."

# Check if AWS structure exists
if [ ! -d "aws/lambda" ]; then
    echo "❌ AWS structure not found. Run migration first."
    exit 1
fi

# Backup netlify directory
echo "📦 Backing up netlify directory..."
if [ -d "netlify" ]; then
    mv netlify netlify.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Netlify directory backed up"
fi

# Remove netlify from package.json scripts if exists
echo "📝 Updating package.json..."
if [ -f "package.json" ]; then
    # Remove @netlify/functions dependency if present
    npm uninstall @netlify/functions 2>/dev/null || true

    # Remove netlify.toml if exists
    if [ -f "netlify.toml" ]; then
        rm netlify.toml
        echo "✅ Removed netlify.toml"
    fi
fi

# Update tsconfig.json to remove netlify references
echo "⚙️  Updating tsconfig.json..."
if [ -f "tsconfig.json" ]; then
    # Use sed to remove netlify from include array
    sed -i.bak '/"netlify"/d' tsconfig.json && rm tsconfig.json.bak 2>/dev/null || true
    echo "✅ Updated tsconfig.json"
fi

echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test AWS Lambda container locally: ./aws/scripts/test-local.sh"
echo "2. Setup IAM: ./aws/scripts/setup-iam.sh"
echo "3. Deploy: ./aws/scripts/build-and-deploy.sh"
echo ""
echo "🔄 If you need to rollback:"
echo "   mv netlify.backup.* netlify"
