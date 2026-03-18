#!/bin/sh

# generate_app_meta.sh
# Scans all app.json files under the apps/ directory and generates .meta/appMeta.json

APPS_DIR="apps"
META_DIR=".meta"
OUTPUT_FILE="$META_DIR/appMeta.json"

# Ensure the .meta directory exists
mkdir -p "$META_DIR"

# Get current timestamp in ISO 8601 format
UPDATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Start building the JSON object
json="{"
first=true

# Find all app.json files recursively and write paths to a temp file
TMPFILE=$(mktemp)
find "$APPS_DIR" -name "app.json" > "$TMPFILE" 2>/dev/null

while IFS= read -r app_json_path; do
  # Get the directory containing app.json (strip the /app.json suffix)
  app_dir=$(dirname "$app_json_path")

  # Extract the id field from app.json using grep + sed (no jq dependency)
  app_id=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$app_json_path" | sed 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | head -n 1)

  # Skip if no id found
  if [ -z "$app_id" ]; then
    echo "WARNING: No 'id' found in $app_json_path — skipping." >&2
    continue
  fi

  # Add comma separator between entries
  if [ "$first" = true ]; then
    first=false
  else
    json="$json,"
  fi

  # Append entry to JSON
  json="$json
  \"$app_id\": {
    \"appPath\": \"$app_dir\",
    \"updatedAt\": \"$UPDATED_AT\"
  }"

done < "$TMPFILE"

# Clean up temp file
rm -f "$TMPFILE"

# Close the JSON object
json="$json
}"

# Write to output file
echo "$json" > "$OUTPUT_FILE"

echo "Generated: $OUTPUT_FILE"
echo "$json"