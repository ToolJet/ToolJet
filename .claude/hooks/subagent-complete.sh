#!/bin/bash

# Simple subagent completion logging
# Just tracks workflow progress without complex validation

# Read input and extract agent name safely
INPUT_DATA=$(cat 2>/dev/null || echo '{}')
SUB_AGENT_NAME=$(echo "$INPUT_DATA" | jq -r '.sub_agent_name // "unknown"' 2>/dev/null || echo "unknown")

# Create log directories if they don't exist
mkdir -p "$HOME/.claude" 2>/dev/null || true
if [[ -n "$CLAUDE_PROJECT_DIR" ]] && [[ -d "$CLAUDE_PROJECT_DIR" ]]; then
    mkdir -p "$CLAUDE_PROJECT_DIR/.claude/logs" 2>/dev/null || true
fi

# Simple workflow progress messages
case "$SUB_AGENT_NAME" in
    "plugin-architect")
        echo "📋 Architecture analysis completed"
        echo "💡 Next: Use /plugin-developer to generate code"
        ;;
    "plugin-developer")
        echo "🔧 Plugin development completed"
        echo "💡 Next: Use /plugin-tester for UI validation"
        ;;
    "plugin-tester")
        echo "🧪 Plugin testing completed"
        echo "💡 Next: Use /plugin-reviewer for final approval"
        ;;
    "plugin-reviewer")
        echo "🎯 Plugin review completed"
        echo "🎉 Plugin development pipeline finished!"
        ;;
esac

# Simple logging (fail silently if directories don't exist)
if [[ "$SUB_AGENT_NAME" != "unknown" ]]; then
    echo "$(date): [$SUB_AGENT_NAME] completed" >> "$HOME/.claude/sub-agent-log.txt" 2>/dev/null || true
    if [[ -n "$CLAUDE_PROJECT_DIR" ]] && [[ -d "$CLAUDE_PROJECT_DIR/.claude/logs" ]]; then
        echo "$(date): [$SUB_AGENT_NAME] completed" >> "$CLAUDE_PROJECT_DIR/.claude/logs/agent-activity.log" 2>/dev/null || true
    fi
fi