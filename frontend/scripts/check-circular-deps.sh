#!/bin/bash
echo "🔍 Checking for circular dependencies..."

# Run madge to check for circular dependencies
npx madge --circular --extensions js,jsx src/

if [ $? -ne 0 ]; then
  echo "❌ Circular dependencies found!"
  exit 1
fi

echo "✅ No circular dependencies found"
exit 0
