#!/bin/sh
set -e

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

BASE_VERSION_FILE="$BASE_DIR/.version"
SERVER_VERSION_FILE="$BASE_DIR/server/.version"
FRONTEND_VERSION_FILE="$BASE_DIR/frontend/.version"

# Read first line of each version file (trim spaces)
BASE_VERSION=$(head -n 1 "$BASE_VERSION_FILE" | tr -d '[:space:]')
SERVER_VERSION=$(head -n 1 "$SERVER_VERSION_FILE" | tr -d '[:space:]')
FRONTEND_VERSION=$(head -n 1 "$FRONTEND_VERSION_FILE" | tr -d '[:space:]')

# Check versions match
if [ "$BASE_VERSION" != "$SERVER_VERSION" ] || [ "$BASE_VERSION" != "$FRONTEND_VERSION" ]; then
  echo "❌ Version mismatch detected!"
  echo "Base:     $BASE_VERSION"
  echo "Server:   $SERVER_VERSION"
  echo "Frontend: $FRONTEND_VERSION"
  exit 1
fi

RELEASE_VERSION="v$BASE_VERSION"

echo "Are you sure you want to release version - $RELEASE_VERSION  $BASE_DIR? (y/n)"
read CONFIRM

if [ "$CONFIRM" != "y" ]; then
  echo "❌ Release aborted."
  exit 1
fi

echo "✅ Starting release process for $RELEASE_VERSION..."

# Tag & push in base
cd "$BASE_DIR"
git tag "$RELEASE_VERSION"
git push origin "$RELEASE_VERSION"

# Tag & push in server/ee
cd "$BASE_DIR/server/ee"
git tag "$RELEASE_VERSION"
git push origin "$RELEASE_VERSION"

# Tag & push in frontend/ee
cd "$BASE_DIR/frontend/ee"
git tag "$RELEASE_VERSION"
git push origin "$RELEASE_VERSION"

echo "🎉 Successfully released $RELEASE_VERSION"
