#!/bin/bash

# Script to resolve git submodule conflicts during rebase
# Usage: ./resolve-submodule-conflicts.sh

set -e  # Exit on any error

echo "🔧 Resolving git submodule conflicts..."

# Function to resolve submodule conflict
resolve_submodule_conflict() {
    local submodule_path=$1
    local submodule_name=$(basename "$submodule_path")
    
    echo "📁 Processing submodule: $submodule_path"
    
    # Check if submodule directory exists
    if [ ! -d "$submodule_path" ]; then
        echo "❌ Error: Submodule directory '$submodule_path' does not exist"
        return 1
    fi
    
    # Step 1: Navigate to submodule directory
    echo "  → Entering $submodule_path"
    cd "$submodule_path"
    
    # Step 2: Get the latest commit hash from main branch
    echo "  → Fetching latest changes..."
    git fetch origin
    
    echo "  → Getting latest commit from main branch..."
    main_commit=$(git rev-parse origin/main)
    echo "  → Latest main commit: $main_commit"
    
    # Step 3: Checkout to the latest main commit
    echo "  → Checking out to latest main commit..."
    git checkout "$main_commit"
    
    # Step 4: Go back to root directory
    echo "  → Returning to root directory..."
    cd - > /dev/null
    
    # Step 5: Stage the submodule changes
    echo "  → Staging submodule changes..."
    git add "$submodule_path"
    
    echo "✅ Resolved conflict for $submodule_path"
    echo ""
}

# Main execution
echo "🚀 Starting submodule conflict resolution..."
echo ""

# Resolve server/ee submodule
if [ -d "server/ee" ]; then
    resolve_submodule_conflict "server/ee"
else
    echo "⚠️  Warning: server/ee directory not found, skipping..."
fi

# Resolve frontend/ee submodule
if [ -d "frontend/ee" ]; then
    resolve_submodule_conflict "frontend/ee"
else
    echo "⚠️  Warning: frontend/ee directory not found, skipping..."
fi

echo "🎉 All submodule conflicts resolved!"
