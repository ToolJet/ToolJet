---
id: overview
title: Overview
---

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) is an open standard for connecting Large Language Models (LLMs) to external platforms. ToolJet MCP is a server that exposes your ToolJet instance to an AI coding agent, so the agent can build and modify apps in the workspace you already work in, without you leaving your editor.

To connect your agent, follow the [Setup](/docs/build-with-ai/mcp/setup) guide.

## What You Can Do

<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
  margin: '1.5rem 0'
}}>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Build Apps</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Create an app from a prompt, with pages, datasource queries, and components generated and bound together for you.</p>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Modify Apps</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Change apps that already exist, whether built by hand, by ToolJet AI, or by your agent earlier. Components and queries are edited in place rather than recreated.</p>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Work with Data</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Inspect the datasources connected to your workspace, create ToolJet DB tables, seed them with rows, and write queries against ToolJet DB, PostgreSQL, REST APIs, or any other connected plugin.</p>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Manage Permissions</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Inspect, set, or clear server-enforced access on an individual page or query within an app.</p>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Manage Users</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Invite users to the workspace, update their profile and role, assign them to existing groups, and archive or unarchive them.</p>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Interact in Natural Language</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Describe the outcome you want in plain language. Your agent picks the right tools on its own, so you never name them yourself.</p>
</div>

</div>

## Benefits of Using ToolJet MCP

- **No ToolJet credits**: Operations run on your AI client's own model subscription, so building through MCP doesn't draw down your ToolJet AI credits.
- **Better output**: Agents build against ToolJet's governed first-party contracts, so they work from the platform's real schemas instead of guessing at its internals.
- **Stays in your workflow**: Create and modify apps from the editor you already work in, with no context switching into ToolJet.
- **Self-verifying**: Agents can run their own queries to confirm the data is right, and those with browser access can open the app they built and check it works before handing it back.
- **Extensible**: Pair ToolJet MCP with other skills, tools, and MCP servers to extend what your agent can do, such as reading a Figma design before building from it.

## Supported MCP Clients

ToolJet MCP works with any MCP-compatible client. The following are supported directly, with a packaged plugin that installs the server and the `tooljet-app-builder` skill together:

<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  margin: '1.5rem 0'
}}>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.1rem 1rem',
  background: 'var(--ifm-background-surface-color)',
  textAlign: 'center'
}}>
<img className="mcp-logo" src="/img/tooljet-ai/mcp/claude-code.svg" alt="Claude Code" />
<div style={{ fontWeight: 600, marginTop: '0.65rem' }}>Claude Code</div>
<div style={{ fontSize: '0.82rem', color: 'var(--ifm-color-emphasis-700)', marginTop: '0.2rem' }}>Anthropic's coding agent in the terminal</div>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.1rem 1rem',
  background: 'var(--ifm-background-surface-color)',
  textAlign: 'center'
}}>
<img className="mcp-logo mcp-logo--dark-art" src="/img/tooljet-ai/mcp/codex.svg" alt="Codex" />
<div style={{ fontWeight: 600, marginTop: '0.65rem' }}>Codex</div>
<div style={{ fontSize: '0.82rem', color: 'var(--ifm-color-emphasis-700)', marginTop: '0.2rem' }}>OpenAI's coding agent in the CLI or IDE</div>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.1rem 1rem',
  background: 'var(--ifm-background-surface-color)',
  textAlign: 'center'
}}>
<svg className="mcp-logo" viewBox="0 0 24 24" role="img" aria-label="Other MCP clients" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7 L10 12 L5 17" /><path d="M13 18 H19" /></svg>
<div style={{ fontWeight: 600, marginTop: '0.65rem' }}>Others</div>
<div style={{ fontSize: '0.82rem', color: 'var(--ifm-color-emphasis-700)', marginTop: '0.2rem' }}>Any MCP-compatible client, such as Cursor or Cline</div>
</div>

</div>

Clients outside this list connect by registering the bundled stdio server manually. See [Setup](/docs/build-with-ai/mcp/setup) for the configuration entry.

## Requirements

- A ToolJet personal access token for the workspace you want to build in
- Node.js 20 or newer, available to your AI client
- An MCP-compatible AI client

## Related

- [Setup](/docs/build-with-ai/mcp/setup) — create a token, set your environment variables, and install for your client
- [App Generation](/docs/build-with-ai/mcp/app-generation) — build and modify apps from your agent
- [App Generation with ToolJet AI](/docs/build-with-ai/generate-applications) — the same outcome using the AI built into ToolJet
