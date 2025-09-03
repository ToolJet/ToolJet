# ToolJet Claude Code Configuration

This directory contains Claude Code configuration for the ToolJet project, enabling AI-assisted development workflows across different areas of the codebase.

## 🚀 Quick Setup

### Automated Setup (Recommended)

Run the setup script for automatic configuration:

```bash
./.claude/setup.sh
```

This script will:
- Create `.env` file from template
- Generate MCP configuration 
- Install project dependencies
- Build required tools
- Set proper permissions

### Manual Setup

If you prefer manual setup:

```bash
# 1. Copy environment template
cp .claude/.env.template .claude/.env

# 2. Edit .claude/.env with your credentials:
# - CLICKUP_API_KEY: Get from ClickUp Settings → Apps
# - CLICKUP_TEAM_ID: Find in ClickUp URL
# - GITHUB_PERSONAL_ACCESS_TOKEN: Create at github.com/settings/tokens

# 3. Generate MCP configuration
cd .claude && ./setup.sh
```

## 🔐 Security Notes

**IMPORTANT: Never commit sensitive files!**

- `.claude/.env` - Environment variables with API keys (gitignored)
- `.claude/.mcp.json` - MCP configuration with credentials (gitignored)
- `.claude/settings.local.json` - Local configuration overrides (gitignored)
- `.claude/logs/*.log` - May contain sensitive data (gitignored)

Always use template files as reference and keep actual credentials in gitignored files.

## 📁 Directory Structure

```
.claude/
├── agents/                    # Subagent definitions
├── commands/                  # Slash commands  
├── docs/                      # Generated documentation and specs
├── hooks/                     # Workflow automation hooks
├── logs/                      # Activity and issue logs
├── .env.template             # Environment variables template
├── .mcp.json.template        # MCP configuration template
├── settings.json             # Claude Code hook configuration
└── setup.sh                 # Automated setup script
```

## 🔧 Configuration

### MCP Servers

The `.mcp.json` file configures Model Context Protocol servers for enhanced functionality:

- **postgres-db**: Database access for development and testing
- **clickup**: Task and document management integration
- **github**: Repository and issue management  
- **fetch**: Web content and API specification retrieval
- **serena**: Advanced code analysis and editing capabilities

### Environment Variables

Configure credentials via environment variables (recommended):

```bash
export CLICKUP_API_KEY="your_clickup_key"
export CLICKUP_TEAM_ID="your_team_id" 
export GITHUB_PERSONAL_ACCESS_TOKEN="your_github_token"
```

### Hooks

Minimal workflow hooks configured in `settings.json`:
- **SubagentStop**: Simple completion logging and progress messages
- Hooks are kept minimal to avoid complexity and timeout issues

## 🎯 Workflow Areas

This Claude Code setup supports development workflows across different areas:

### Plugin Development
- **Location**: `marketplace/.claude/`
- **Agents**: plugin-architect, plugin-developer, plugin-tester, plugin-reviewer  
- **Purpose**: Automated ToolJet plugin creation and testing
- **Documentation**: See `marketplace/CLAUDE.md` for complete workflow details

### Future Workflows
Additional agents and workflows can be added to support:
- Frontend component development
- Backend API development
- Database schema management
- CI/CD automation
- Documentation generation

## 🚀 Usage

### Agent Invocation
Use natural language to invoke specific agents:
```bash
"Use the [agent-name] subagent to [task description]"
```

### Slash Commands
Execute complete workflows:
```bash
/[command-name] [arguments]
```

### Available Commands
```bash
# List available agents
/agents

# View specific workflow documentation
ls .claude/commands/

# Check logs
ls .claude/logs/
```

## 🔍 Getting Started

1. **Run setup**: `./.claude/setup.sh`
2. **Choose workflow**: Navigate to specific area documentation
   - **Plugin Development**: `marketplace/CLAUDE.md`
3. **Follow workflow-specific guides** for detailed usage instructions

## 🤝 Adding New Workflows

To add new agent workflows:

1. **Create agent definitions** in `.claude/agents/`
2. **Add slash commands** in `.claude/commands/` (if needed)  
3. **Document workflow** in appropriate subdirectory
4. **Update this README** with navigation references

This modular approach allows the Claude Code setup to scale across different development areas while maintaining clean organization.