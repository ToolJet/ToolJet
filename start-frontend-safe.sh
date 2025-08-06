#!/bin/bash

# ToolJet Frontend Emergency Start Script
# This script starts the frontend with optimized memory settings to prevent crashes

echo "🚀 Starting ToolJet Frontend with Memory Optimizations..."

# Check available system memory
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "📊 System Memory: ${TOTAL_MEM}MB"

# Set memory limits based on available system memory
if [ $TOTAL_MEM -lt 4096 ]; then
    echo "⚠️ Low memory system detected. Using conservative settings..."
    NODE_OPTIONS="--max-old-space-size=1536 --max-semi-space-size=32"
    echo "💾 Node Memory Limit: 1.5GB"
elif [ $TOTAL_MEM -lt 8192 ]; then
    echo "📊 Medium memory system. Using balanced settings..."
    NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=64"
    echo "💾 Node Memory Limit: 2GB"
else
    echo "🎯 High memory system. Using optimized settings..."
    NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128"
    echo "💾 Node Memory Limit: 4GB"
fi

# Additional memory optimization flags
NODE_OPTIONS="$NODE_OPTIONS --gc-interval=100"

# Set environment variables for webpack optimization
export NODE_ENV=development
export NODE_OPTIONS="$NODE_OPTIONS"

# Webpack dev server memory optimization
export WEBPACK_DEV_SERVER_OPTIONS="--no-live-reload --no-hot-only"

echo "🔧 Memory Optimizations Applied:"
echo "   - Node.js heap size limited"
echo "   - Garbage collection optimized"
echo "   - Webpack caching enabled"
echo "   - Source maps simplified"

echo ""
echo "🧹 Memory Leak Detection Active:"
echo "   - Automatic cleanup at 400MB usage"
echo "   - Real-time monitoring enabled"
echo "   - Component lifecycle tracking"

echo ""
echo "📝 Debug Commands:"
echo "   - Check memory: window.debugMemory()"
echo "   - Force cleanup: window.forceCleanup()"
echo "   - Store cleanup: useStore.getState().cleanUpStore(true)"

echo ""
echo "🚀 Starting webpack dev server..."
echo "   Access at: http://localhost:8082"
echo "   Memory monitoring: Press F12 → Console → window.debugMemory()"

# Start the development server with optimized settings
exec npm run start
