# ToolJet Plugin Development with Claude Code

This directory contains specialized Claude Code configuration for automated ToolJet plugin development using a sophisticated subagent system.

## 🤖 Plugin Development Subagents

### plugin-architect
- **Purpose**: Analyzes API documentation and creates comprehensive architecture specifications
- **References**: `TECHNICAL-REFERENCE.md` and `PLUGIN_SCHEMAS.md`
- **Triggers**: API URLs, OpenAPI specs, ClickUp PRDs, Figma designs
- **Output**: Detailed architecture document with UI requirements and SDK recommendations

### plugin-developer
- **Purpose**: Implements complete plugins based on architecture specifications
- **References**: Schema documentation for compliance and widget types
- **Triggers**: After architect completes, or when issues are reported by tester
- **Output**: Complete plugin files in `marketplace/plugins/`

### plugin-tester
- **Purpose**: UI verification against PRD and design specifications using automated testing
- **Test URLs**:
  - Marketplace: `http://localhost:8082/integrations/marketplace`
  - Data Sources: `http://localhost:8082/tooljets-workspace/data-sources`
  - App Builder: `http://localhost:8082/` → Create app → Add query from data-pane
- **Triggers**: After developer completes implementation
- **Tools**: Playwright for automated UI testing and validation
- **Output**: Issues logged with detailed screenshots and reproduction steps

### plugin-reviewer
- **Purpose**: Final quality, security, and PRD compliance review
- **Triggers**: After all tester issues are resolved
- **Output**: Comprehensive review report and approval status

## 🔄 Self-Corrective Development Loop

The system implements an intelligent self-corrective workflow:

1. **plugin-architect** creates architecture specification
2. **plugin-developer** implements the plugin
3. **plugin-tester** validates UI against design specifications
4. If issues found → **plugin-developer** fixes issues automatically
5. Loop continues until **plugin-tester** reports clean validation
6. **plugin-reviewer** performs final comprehensive review

## 🚀 Usage Examples

### Individual Agent Invocation

```bash
# Analyze API and create architecture
"Use the plugin-architect subagent to analyze https://api.stripe.com/docs"
"Have the plugin-architect subagent analyze ClickUp task CU-12345"

# Generate plugin code
"Use the plugin-developer subagent to implement stripe-plugin"
"Have the plugin-developer subagent create plugin from architecture spec"

# Test plugin UI
"Use the plugin-tester subagent to validate stripe-plugin against design"

# Final review
"Have the plugin-reviewer subagent review stripe-plugin for release"
```

### Complete Pipeline Command

```bash
# Full end-to-end workflow with self-corrective loop
/plugin-pipeline https://api.stripe.com/docs
/plugin-pipeline ClickUp task CU-12345
```

### Workflow Combinations

```bash
# Fix existing plugin issues
"Use the plugin-developer subagent to fix issues in existing-plugin"
"Have the plugin-tester subagent re-test existing-plugin"

# Architecture analysis only
"Use the plugin-architect subagent to analyze https://api.new-service.com/docs"

# Review existing plugin
"Have the plugin-reviewer subagent review my-existing-plugin"
```

## 📁 Documentation Structure

### Core Documentation
- **[../CLAUDE.md](../CLAUDE.md)** - Main plugin development guide and reference
- **[PLUGIN_SCHEMAS.md](PLUGIN_SCHEMAS.md)** - Complete schema reference for manifest.json and operations.json
- **[TECHNICAL-REFERENCE.md](TECHNICAL-REFERENCE.md)** - Deep technical implementation details and dynamic form patterns

### Template System
- **templates/v1/** - Legacy format templates (manifest + operations)
  - `api-key-manifest.json`, `oauth-manifest.json`, `openapi-manifest.json`
  - `api-operations.json`, `database-operations.json`, `openapi-operations.json`
- **templates/v2/** - Modern format templates (manifest only)
  - `api-key-manifest.json`, `oauth-manifest.json`, `database-manifest.json`, `multi-auth-manifest.json`

### Schema Validation
- **schemas/dynamicform-v1-schema.json** - Validates operations.json files
- **schemas/dynamicform-v2-schema.json** - Validates modern manifest.json files

## 🎯 Best Practices for Plugin Development

1. **Use natural language for individual agents** - Clear, descriptive requests get better results
2. **Use `/plugin-pipeline` for complete workflows** - Automated end-to-end development with quality assurance
3. **Let Claude Code auto-delegate** - Agents are selected automatically based on context
4. **Trust the self-corrective loop** - Developer and tester resolve issues automatically
5. **Provide comprehensive input** - API docs, PRDs, and design specifications improve output quality

## 🤝 Interactive Development

Subagents will ask for clarification when:
- API documentation is ambiguous or incomplete
- Multiple authentication methods are available
- Design specifications are unclear or contradictory
- PRD requirements need additional context
- Schema validation fails and guidance is needed

Simply respond to their questions to keep the development workflow moving smoothly.

## 🔧 Technical Setup

This directory is automatically configured when you run the root setup script:

```bash
# From ToolJet root directory
./.claude/setup.sh
```

The setup ensures:
- Schema validation tools are available
- Template system is properly configured  
- MCP servers are configured for enhanced functionality
- All subagents have access to required resources

## 📋 Issue Tracking

Plugin development issues are tracked in structured format:

```markdown
## Plugin: [name]
### Issue ID: [timestamp]-[agent]
- **Reported by:** plugin-tester
- **Status:** open/fixed/verified
- **Page:** datasource/marketplace/query-manager
- **Expected:** [from design specification]
- **Actual:** [current implementation]
- **Screenshot:** [attached evidence]
```

Issues are automatically resolved through the self-corrective loop between plugin-developer and plugin-tester.

---

**Main Documentation**: For complete setup instructions and workflow details, see [../CLAUDE.md](../CLAUDE.md)