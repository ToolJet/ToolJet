#!/bin/bash
set -e

# Configuration
DOCKER_REPO="tooljet/tooljet"
MARKDOWN_FILE="docs/versioned_docs/version-3.16.0-LTS/setup/overview/choose-your-tooljet.mdx"
TABLE_HEADER="| Version | Release Date | Docker Pull Command |"
TABLE_DIVIDER="|---------|--------------|----------------------|"
DRY_RUN=false

# Enhanced logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Check if required tools are available
check_dependencies() {
    log "🔧 Checking dependencies..."
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        exit 1
    fi
    
    log "✅ All dependencies available"
}

# Cross-platform date formatting
format_date() {
    local input_date="$1"
    
    if [[ -z "$input_date" || "$input_date" == "null" ]]; then
        echo "INVALID_DATE"
        return 1
    fi
    
    # Try different date command formats (macOS vs Linux)
    if date --version >/dev/null 2>&1; then
        # GNU date (Linux)
        date -d "$input_date" "+%B %e, %Y" 2>/dev/null || echo "INVALID_DATE"
    else
        # BSD date (macOS)
        date -jf "%Y-%m-%d" "$input_date" "+%B %e, %Y" 2>/dev/null || echo "INVALID_DATE"
    fi
}

if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    log "💡 Dry run mode ON — no file will be modified"
fi

# Fetch all LTS tags with enhanced error handling
get_lts_tags() {
    log "🌐 Fetching LTS tags from DockerHub..."
    local tags=()
    local url="https://hub.docker.com/v2/repositories/${DOCKER_REPO}/tags?page_size=100"
    local page_count=0
    
    while [ -n "$url" ]; do
        ((page_count++))
        log "🔍 Fetching page $page_count: $url"
        
        local resp
        if ! resp=$(curl -sS --fail --max-time 30 "$url" 2>/dev/null); then
            log_error "Failed to fetch tags from DockerHub API"
            return 1
        fi
        
        if ! echo "$resp" | jq . >/dev/null 2>&1; then
            log_error "Invalid JSON response from DockerHub API"
            return 1
        fi
        
        local page_tags
        page_tags=$(echo "$resp" | jq -r '.results[]? | select(.name | test("^v[0-9]+\\.[0-9]+\\.[0-9]+(-ee)?-lts$")) | .name' 2>/dev/null)
        
        if [[ -n "$page_tags" ]]; then
            while IFS= read -r tag; do
                [[ -n "$tag" ]] && tags+=("$tag")
            done <<< "$page_tags"
        fi
        
        url=$(echo "$resp" | jq -r '.next // empty' 2>/dev/null)
        [[ "$url" == "null" || -z "$url" ]] && break
        
        # Safety check to prevent infinite loops
        if [[ $page_count -gt 10 ]]; then
            log "⚠️  Reached maximum page limit (10), stopping pagination"
            break
        fi
    done
    
    if [[ ${#tags[@]} -eq 0 ]]; then
        log_error "No LTS tags found"
        return 1
    fi
    
    log "✅ Found ${#tags[@]} LTS tags"
    
    # Sort tags by version (reverse)
    IFS=$'\n' tags=($(printf '%s\n' "${tags[@]}" | sort -Vr))

    # Cap to 10 most recent tags
    if [[ ${#tags[@]} -gt 10 ]]; then
        tags=("${tags[@]:0:10}")
        log "✂️  Capped to 10 most recent LTS tags"
    fi

    log "📋 LTS tags (sorted):"
    printf '   %s\n' "${tags[@]}"
    
    printf '%s\n' "${tags[@]}"
}

# Get SHA and formatted release date for a tag
get_tag_metadata() {
    local tag="$1"
    local url="https://hub.docker.com/v2/repositories/${DOCKER_REPO}/tags/${tag}"
    
    log "📦 Fetching metadata for $tag"
    
    local data
    if ! data=$(curl -sS --fail --max-time 30 "$url" 2>/dev/null); then
        log_error "Failed to fetch metadata for $tag"
        echo "SKIP"
        return 1
    fi
    
    if ! echo "$data" | jq . >/dev/null 2>&1; then
        log_error "Invalid JSON response for $tag metadata"
        echo "SKIP"
        return 1
    fi
    
    local sha
    sha=$(echo "$data" | jq -r '.images[0]?.digest // empty' 2>/dev/null | cut -d: -f2)
    
    if [[ -z "$sha" ]]; then
        log_error "No SHA found for $tag"
        echo "SKIP"
        return 1
    fi
    
    local raw_date
    raw_date=$(echo "$data" | jq -r '.last_updated // empty' 2>/dev/null | sed 's/T.*//')
    
    if [[ -z "$raw_date" ]]; then
        log "⚠️  No release date found for $tag, skipping"
        echo "SKIP"
        return 1
    fi
    
    local formatted_date
    formatted_date=$(format_date "$raw_date")
    
    if [[ "$formatted_date" == "INVALID_DATE" ]]; then
        log "⚠️  Invalid date format for $tag: $raw_date, skipping"
        echo "SKIP"
        return 1
    fi
    
    log "✅ $tag: SHA=${sha:0:12}..., Date=$formatted_date"
    echo "$sha|$formatted_date"
}

# Build table rows
build_table_rows() {
    local tags=("$@")
    local rows=()
    
    log "📋 Generating markdown table rows for ${#tags[@]} tags:"
    
    for tag in "${tags[@]}"; do
        local meta
        meta=$(get_tag_metadata "$tag")
        
        if [[ "$meta" == "SKIP" ]]; then
            log "⏭️  Skipped $tag"
            continue
        fi
        
        local sha date
        sha=$(echo "$meta" | cut -d'|' -f1)
        date=$(echo "$meta" | cut -d'|' -f2)
        
        log "➕ Adding row: $tag → $date"
        local row="| [${tag}](https://hub.docker.com/layers/tooljet/tooljet/${tag}/images/sha256-${sha}?context=explore) | ${date} | \`docker pull tooljet/tooljet:${tag}\` |"
        rows+=("$row")
    done
    
    if [[ ${#rows[@]} -eq 0 ]]; then
        log_error "No valid rows generated"
        return 1
    fi
    
    log "📝 Generated ${#rows[@]} table rows"
    printf "%s\n" "${rows[@]}"
}

# Replace old table in the markdown
replace_table_in_file() {
    local tags=("$@")
    
    if [[ ! -f "$MARKDOWN_FILE" ]]; then
        log_error "Markdown file not found: $MARKDOWN_FILE"
        return 1
    fi
    
    log "📄 Processing markdown file: $MARKDOWN_FILE"
    
    local table_body
    if ! table_body=$(build_table_rows "${tags[@]}"); then
        log_error "Failed to build table rows"
        return 1
    fi
    
    log ""
    log "🧪 Preview of updated table:"
    log "--------------------------------"
    echo "$TABLE_HEADER"
    echo "$TABLE_DIVIDER"
    echo "$table_body"
    log "--------------------------------"
    
    if $DRY_RUN; then
        log "✅ Dry run finished — no file changes made."
        return 0
    fi
    
    log "✍️  Writing to $MARKDOWN_FILE..."
    local tmp_md="${MARKDOWN_FILE}.tmp"

    local new_table="${TABLE_HEADER}
${TABLE_DIVIDER}
${table_body}"

    awk -v tbl="$new_table" '
        /^### Latest Patch$/ { print; print ""; print tbl; skip=1; next }
        /^### Base Versions$/ { skip=0 }
        !skip { print }
    ' "$MARKDOWN_FILE" > "$tmp_md"

    if ! mv "$tmp_md" "$MARKDOWN_FILE"; then
        log_error "Failed to move temporary file to $MARKDOWN_FILE"
        return 1
    fi

    log "✅ Markdown updated successfully"
}

main() {
    log "🚀 Starting ToolJet LTS table regeneration..."
    
    # Check dependencies first
    check_dependencies
    
    # Get LTS tags
    local tags_output
    if ! tags_output=$(get_lts_tags); then
        log_error "Failed to fetch LTS tags"
        exit 1
    fi
    
    # Convert output to array
    local tags=()
    while IFS= read -r tag; do
        [[ -n "$tag" ]] && tags+=("$tag")
    done <<< "$tags_output"
    
    if [[ ${#tags[@]} -eq 0 ]]; then
        log_error "No tags to process"
        exit 1
    fi
    
    log "🎯 Processing ${#tags[@]} tags total"
    
    # Replace table in file
    if ! replace_table_in_file "${tags[@]}"; then
        log_error "Failed to update markdown file"
        exit 1
    fi
    
    log "🎉 Done! Successfully processed ${#tags[@]} tags"
}

# Run main function
main "$@"