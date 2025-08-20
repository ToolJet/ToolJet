#!/bin/bash
set -e

# ToolJet Plugin Development Setup Script
# This script helps configure the Claude Code environment securely

CLAUDE_DIR=".claude"
PROJECT_ROOT="$(pwd)"

echo "🚀 ToolJet Plugin Development Setup"
echo "======================================"

# Check if we're in the right directory
if [[ ! -d "$CLAUDE_DIR" ]] || [[ ! -d "marketplace" ]]; then
    echo "❌ Error: Please run this script from the ToolJet project root directory"
    exit 1
fi

# Create .env file from template if it doesn't exist
if [[ ! -f "$CLAUDE_DIR/.env" ]]; then
    echo "📝 Creating environment file from template..."
    cp "$CLAUDE_DIR/.env.template" "$CLAUDE_DIR/.env"
    
    # Update CLAUDE_PROJECT_DIR with actual path
    sed -i.bak "s|CLAUDE_PROJECT_DIR=.*|CLAUDE_PROJECT_DIR=$PROJECT_ROOT|g" "$CLAUDE_DIR/.env"
    rm "$CLAUDE_DIR/.env.bak" 2>/dev/null || true
    
    echo "✅ Created $CLAUDE_DIR/.env from template"
    echo "⚠️  Please edit $CLAUDE_DIR/.env and add your API keys:"
    echo "   - CLICKUP_API_KEY"
    echo "   - CLICKUP_TEAM_ID" 
    echo "   - GITHUB_PERSONAL_ACCESS_TOKEN"
else
    echo "✅ Environment file already exists: $CLAUDE_DIR/.env"
fi

# Create MCP configuration from template if it doesn't exist
if [[ ! -f "$CLAUDE_DIR/.mcp.json" ]]; then
    echo "📝 Creating MCP configuration from template..."
    cp "$CLAUDE_DIR/.mcp.json.template" "$CLAUDE_DIR/.mcp.json"
    echo "✅ Created $CLAUDE_DIR/.mcp.json from template"
else
    echo "✅ MCP configuration already exists: $CLAUDE_DIR/.mcp.json"
fi

# Ensure log directories exist
echo "📁 Creating log directories..."
mkdir -p "$CLAUDE_DIR/logs"
touch "$CLAUDE_DIR/logs/plugin-issues.log"
touch "$CLAUDE_DIR/logs/agent-activity.log"

# Check if marketplace dependencies are installed
if [[ ! -d "marketplace/node_modules" ]]; then
    echo "📦 Installing marketplace dependencies..."
    cd marketplace
    npm install
    cd "$PROJECT_ROOT"
    echo "✅ Marketplace dependencies installed"
else
    echo "✅ Marketplace dependencies already installed"
fi

# Check if CLI is built
if [[ ! -d "cli/dist" ]] && [[ -f "cli/package.json" ]]; then
    echo "🔧 Building ToolJet CLI..."
    cd cli
    npm install
    npm run build
    cd "$PROJECT_ROOT"
    echo "✅ ToolJet CLI built"
else
    echo "✅ ToolJet CLI ready"
fi

# Verify hook permissions
echo "🔐 Setting hook permissions..."
chmod +x "$CLAUDE_DIR/hooks"/*.sh 2>/dev/null || true
chmod +x "$CLAUDE_DIR/setup.sh"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit $CLAUDE_DIR/.env with your API keys"
echo "2. Use natural language to invoke agents:"
echo "   \"Use the plugin-architect subagent to analyze https://api.stripe.com/docs\""
echo "   \"Have the plugin-developer subagent implement stripe-plugin\""
echo "   \"Use the plugin-tester subagent to validate stripe-plugin\""
echo "   \"Have the plugin-reviewer subagent review stripe-plugin\""
echo "3. Or use the complete pipeline:"
echo "   /plugin-pipeline https://api.stripe.com/docs"
echo ""
echo "⚠️  Security reminder: Never commit .env or .mcp.json files!"