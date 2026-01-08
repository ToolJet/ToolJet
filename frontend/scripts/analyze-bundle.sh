#!/bin/bash

# ToolJet Frontend Bundle Analysis Script
# Analyzes webpack build output and shows chunk distribution

set -e

BUILD_DIR="./build"
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         ToolJet Frontend Bundle Analysis - Phase 1            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory not found. Run 'npm run build' first.${NC}"
    exit 1
fi

cd "$BUILD_DIR"

# Function to convert bytes to human readable
human_readable() {
    local bytes=$1
    if [ $bytes -ge 1073741824 ]; then
        echo "$(echo "scale=2; $bytes/1073741824" | bc)GB"
    elif [ $bytes -ge 1048576 ]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc)MB"
    elif [ $bytes -ge 1024 ]; then
        echo "$(echo "scale=2; $bytes/1024" | bc)KB"
    else
        echo "${bytes}B"
    fi
}

# Get file sizes
get_size() {
    local file=$1
    if [ -f "$file" ]; then
        stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

# Critical chunks (loaded immediately)
echo -e "${GREEN}📦 CRITICAL CHUNKS (Initial Load):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CRITICAL_TOTAL=0

# Runtime chunk
RUNTIME=$(ls runtime.*.js 2>/dev/null | head -1)
if [ -n "$RUNTIME" ]; then
    SIZE=$(get_size "$RUNTIME")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "runtime" "$(human_readable $SIZE)"
fi

# React vendor
REACT=$(ls vendor-react.*.js 2>/dev/null | head -1)
if [ -n "$REACT" ]; then
    SIZE=$(get_size "$REACT")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "vendor-react (React core)" "$(human_readable $SIZE)"
fi

# CodeMirror
CODEMIRROR=$(ls vendor-codemirror.*.js 2>/dev/null | head -1)
if [ -n "$CODEMIRROR" ]; then
    SIZE=$(get_size "$CODEMIRROR")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "vendor-codemirror (Code editor)" "$(human_readable $SIZE)"
fi

# Icons (will be optimized in Phase 2)
ICONS=$(ls vendor-icons.*.js 2>/dev/null | head -1)
if [ -n "$ICONS" ]; then
    SIZE=$(get_size "$ICONS")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s ${YELLOW}⚠️  Phase 2${NC}\n" "vendor-icons (Icon library)" "$(human_readable $SIZE)"
fi

# Radix UI
RADIX=$(ls vendor-radix.*.js 2>/dev/null | head -1)
if [ -n "$RADIX" ]; then
    SIZE=$(get_size "$RADIX")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "vendor-radix (UI components)" "$(human_readable $SIZE)"
fi

# Lodash
LODASH=$(ls vendor-lodash.*.js 2>/dev/null | head -1)
if [ -n "$LODASH" ]; then
    SIZE=$(get_size "$LODASH")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "vendor-lodash (Utilities)" "$(human_readable $SIZE)"
fi

# Date libraries
DATE=$(ls vendor-date.*.js 2>/dev/null | head -1)
if [ -n "$DATE" ]; then
    SIZE=$(get_size "$DATE")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "vendor-date (Date libraries)" "$(human_readable $SIZE)"
fi

# Yjs
YJS=$(ls vendor-yjs.*.js 2>/dev/null | head -1)
if [ -n "$YJS" ]; then
    SIZE=$(get_size "$YJS")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "vendor-yjs (Real-time collab)" "$(human_readable $SIZE)"
fi

# React Spring
SPRING=$(ls vendor-react-spring.*.js 2>/dev/null | head -1)
if [ -n "$SPRING" ]; then
    SIZE=$(get_size "$SPRING")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "vendor-react-spring (Animations)" "$(human_readable $SIZE)"
fi

# Common vendor
COMMON=$(ls vendor-common.*.js 2>/dev/null | head -1)
if [ -n "$COMMON" ]; then
    SIZE=$(get_size "$COMMON")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s\n" "vendor-common (Other libraries)" "$(human_readable $SIZE)"
fi

# Main app code
MAIN=$(ls main.*.js 2>/dev/null | head -1)
if [ -n "$MAIN" ]; then
    SIZE=$(get_size "$MAIN")
    CRITICAL_TOTAL=$((CRITICAL_TOTAL + SIZE))
    printf "  %-50s %10s ${YELLOW}⚠️  Phase 3-4${NC}\n" "main (App code)" "$(human_readable $SIZE)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "  ${GREEN}%-50s %10s${NC}\n" "TOTAL CRITICAL (Initial Load)" "$(human_readable $CRITICAL_TOTAL)"
echo ""

# Deferred chunks (can be lazy loaded)
echo -e "${BLUE}💤 DEFERRED CHUNKS (Can be Lazy Loaded):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DEFERRED_TOTAL=0

# Plotly
PLOTLY=$(ls vendor-plotly.*.js 2>/dev/null | head -1)
if [ -n "$PLOTLY" ]; then
    SIZE=$(get_size "$PLOTLY")
    DEFERRED_TOTAL=$((DEFERRED_TOTAL + SIZE))
    printf "  %-50s %10s ${CYAN}⏳ Phase 5${NC}\n" "vendor-plotly (Chart library)" "$(human_readable $SIZE)"
fi

# PDF
PDF=$(ls vendor-pdf.*.js 2>/dev/null | head -1)
if [ -n "$PDF" ]; then
    SIZE=$(get_size "$PDF")
    DEFERRED_TOTAL=$((DEFERRED_TOTAL + SIZE))
    printf "  %-50s %10s ${GREEN}✅ Already lazy${NC}\n" "vendor-pdf (PDF viewer)" "$(human_readable $SIZE)"
fi

# XLSX
XLSX=$(ls vendor-xlsx.*.js 2>/dev/null | head -1)
if [ -n "$XLSX" ]; then
    SIZE=$(get_size "$XLSX")
    DEFERRED_TOTAL=$((DEFERRED_TOTAL + SIZE))
    printf "  %-50s %10s ${CYAN}⏳ Phase 5${NC}\n" "vendor-xlsx (Excel processing)" "$(human_readable $SIZE)"
fi

# Other chunks
OTHER_CHUNKS=$(ls *.chunk.js 2>/dev/null | wc -l | xargs)
if [ "$OTHER_CHUNKS" -gt 0 ]; then
    OTHER_SIZE=0
    for file in *.chunk.js; do
        if [ -f "$file" ]; then
            SIZE=$(get_size "$file")
            OTHER_SIZE=$((OTHER_SIZE + SIZE))
        fi
    done
    DEFERRED_TOTAL=$((DEFERRED_TOTAL + OTHER_SIZE))
    printf "  %-50s %10s\n" "Other chunks ($OTHER_CHUNKS files)" "$(human_readable $OTHER_SIZE)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "  ${BLUE}%-50s %10s${NC}\n" "TOTAL DEFERRED (Lazy Loadable)" "$(human_readable $DEFERRED_TOTAL)"
echo ""

# Grand Total
GRAND_TOTAL=$((CRITICAL_TOTAL + DEFERRED_TOTAL))
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
printf "  ${CYAN}%-50s %10s${NC}\n" "GRAND TOTAL (All Chunks)" "$(human_readable $GRAND_TOTAL)"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Statistics
TOTAL_FILES=$(ls *.js 2>/dev/null | wc -l | xargs)
echo -e "${YELLOW}📊 STATISTICS:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Total JavaScript files: $TOTAL_FILES"
echo "  Critical chunks: Loaded immediately on page load"
echo "  Deferred chunks: Can be lazy loaded when needed"
echo ""

# Compression info
if [ -f "vendor-common.*.js.gz" ]; then
    echo "  ✅ Gzip compression enabled"
else
    echo "  ⚠️  Gzip compression: Check if enabled in production"
fi
echo ""

# Recommendations
echo -e "${GREEN}💡 RECOMMENDATIONS:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CRITICAL_MB=$((CRITICAL_TOTAL / 1048576))

if [ $CRITICAL_MB -gt 100 ]; then
    echo "  🔴 Critical load is ${CRITICAL_MB}MB - Proceed with Phase 2-5"
    echo "     • Phase 2: Fix icon imports (8-10MB savings)"
    echo "     • Phase 3: Route lazy loading (20-30MB savings)"
    echo "     • Phase 4: Widget lazy loading (15-20MB savings)"
    echo "     • Phase 5: Library lazy loading (defer plotly/xlsx)"
elif [ $CRITICAL_MB -gt 60 ]; then
    echo "  🟡 Critical load is ${CRITICAL_MB}MB - Consider Phase 2-3"
    echo "     • Phase 2: Fix icon imports"
    echo "     • Phase 3: Route lazy loading"
else
    echo "  🟢 Critical load is ${CRITICAL_MB}MB - Excellent!"
    echo "     • Bundle is well optimized"
fi

echo ""

# Comparison with baseline (if available)
if [ -f "../webpack.config.js.backup" ]; then
    echo -e "${CYAN}📈 COMPARISON:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Before Phase 1 (estimated):"
    echo "    • vendor.js: ~93MB"
    echo "    • main.js: ~62MB"
    echo "    • Total: ~155MB"
    echo ""
    echo "  After Phase 1 (actual):"
    printf "    • Critical chunks: %s\n" "$(human_readable $CRITICAL_TOTAL)"
    printf "    • Deferred chunks: %s\n" "$(human_readable $DEFERRED_TOTAL)"
    printf "    • Total: %s\n" "$(human_readable $GRAND_TOTAL)"
    echo ""

    # Calculate improvement potential
    BASELINE=162529280  # 155MB in bytes
    if [ $CRITICAL_TOTAL -lt $BASELINE ]; then
        SAVINGS=$((BASELINE - CRITICAL_TOTAL))
        PERCENT=$((SAVINGS * 100 / BASELINE))
        echo "  🎉 Potential savings: $(human_readable $SAVINGS) ($PERCENT%) when Phase 5 is implemented"
    fi
fi

echo ""
echo -e "${GREEN}✅ Analysis complete!${NC}"
echo ""
