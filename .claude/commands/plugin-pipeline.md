---
description: Execute complete plugin development pipeline with self-corrective loop
argument-hint: <API_URL|OpenAPI_spec|ClickUp_task_ID>
---

Execute the complete plugin development workflow for $ARGUMENTS:

1. **plugin-architect**: Analyze API and create architecture
2. **plugin-developer**: Generate plugin code
3. **plugin-tester**: Validate UI against specs
4. **Self-corrective loop**: Developer fixes issues → Tester verifies → Repeat until clean
5. **plugin-reviewer**: Final quality and security review

Process continues until reviewer approval is achieved.