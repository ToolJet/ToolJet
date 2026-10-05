# Context intake

Kickoff is interactive. Before planning, gather everything the slices depend on: linked designs and docs, screenshots, examples. Fetch what the session can reach, and ask the user for the rest. Ask one question at a time.

## 1. Inventory

Read the parent issue and its comments (`gh issue view <n> --repo ToolJet/tj-ee --comments`). List every external reference:
- Figma;
- ClickUp;
- other GitHub issues and PRs;
- Jam or Loom recordings;
- Slack threads;
- docs URLs;
- images or attachments in the body.

## 2. Fetch, connect, or ask, per source

For each source, first check whether this session has a tool for it, then act:

| Source                       | Has a tool?                                                                    | If yes                                                  | If no                                                      |
| ---------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- |
| GitHub issue/PR              | `gh` (always)                                                                  | `gh issue view` / `gh pr view --comments`               | —                                                          |
| Figma                        | Figma MCP tools such as `get_design_context`, `get_screenshot`, `get_metadata` | Fetch the linked node: design context plus a screenshot | Offer setup, or ask for exports or screenshots             |
| ClickUp                      | ClickUp MCP tools such as `clickup_get_task`, `clickup_search`                 | Fetch the task or doc                                   | Offer setup, or ask the user to paste the relevant part    |
| Jam / other MCP-backed tools | That server's tools                                                            | Fetch                                                   | Ask the user to paste or describe it                       |
| Images in the issue          | Readable if the harness can open the URL                                       | View them                                               | Ask the user to drop the screenshots into the conversation |
| Slack, private docs          | Usually not reachable                                                          | —                                                       | Ask the user to paste the relevant excerpt                 |

**Server listed but not authenticated.** Run its `authenticate` tool, give the user the login link, then retry.

**No server at all.** Ask the user which they prefer:
- **Set it up now** (Claude Code). It takes effect after a session restart, so offer to continue with pasted context in the meantime.
  - Figma: `claude plugin install figma@claude-plugins-official`, or `claude mcp add --transport http figma https://mcp.figma.com/mcp`
  - ClickUp: `claude mcp add --transport http clickup https://mcp.clickup.com/mcp`
  - Other harnesses (Cursor, Codex): add the same HTTP MCP URL to that harness's MCP config.
- **Paste or screenshot instead.**
- **Skip.** Record the source as **Unknown** in the plan, along with what it might change.

Never plan silently around an unread link. Each one ends up fetched, pasted, or explicitly skipped.

## 3. Ask for missing context

Only ask for what changes the slicing or the acceptance criteria, one question at a time. The user can always answer "skip".

- **UI work with no design:** "Do you have a Figma frame or screenshots of the intended UI?"
- **Bug or behavior change:** "Can you share a screenshot or recording of the current behavior, and what it should look like instead?"
- **API or data work:** "Any example requests, payloads or data shapes we must support?"
- **Customer-driven work:** "What's the customer scenario: roles, scale, edition?" Customer specifics stay in tj-ee and never go into public branches or PRs.
- **Constraints:** "Any deadline, feature flag, edition gating or rollout constraint?"

## 4. Record

Add a **Context sources** section to the plan header: each source, how it was obtained (fetched / pasted / skipped), and the key facts taken from it.

Screenshots pasted into the conversation don't reach GitHub. If a builder or verifier will need one (for example, the expected UI for a browser check), ask the user to attach it to the parent issue, and reference it from the acceptance criterion.
