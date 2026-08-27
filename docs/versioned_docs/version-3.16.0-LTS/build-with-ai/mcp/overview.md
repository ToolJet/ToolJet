---
id: overview
title: Overview
---

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) is a standard for connecting Large Language Models (LLMs) to platforms like ToolJet. This guide covers how to connect ToolJet to AI tools using MCP, enabling your AI assistants to interact with and manage your ToolJet instance.

## What is ToolJet MCP?

ToolJet MCP is a bridge that connects AI assistants to your ToolJet platform through the Model Context Protocol. This allows AI tools to:

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
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Create Applications</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Build new apps from a prompt, with pages, queries, and components generated for you.</p>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Modify Applications</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Update existing apps by adding components, editing queries, or restructuring pages.</p>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>User Management</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Create users, update their profiles, and manage roles across your workspaces.</p>
</div>

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  padding: '1.25rem',
  background: 'var(--ifm-background-surface-color)'
}}>
<h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.05rem' }}>Interact in Natural Language</h3>
<p style={{ marginBottom: 0, color: 'var(--ifm-color-emphasis-700)' }}>Query and manage your ToolJet instance by describing what you need in plain language.</p>
</div>

</div>

## Supported LLMs

ToolJet MCP works with the following LLM providers:

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
<img className="mcp-logo mcp-logo--light-art" src="/img/tooljet-ai/mcp/grok-build.svg" alt="Grok Build" />
<div style={{ fontWeight: 600, marginTop: '0.65rem' }}>Grok Build</div>
<div style={{ fontSize: '0.82rem', color: 'var(--ifm-color-emphasis-700)', marginTop: '0.2rem' }}>xAI's agentic building experience</div>
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

:::note Data Access
An agent connected over MCP acts with the permissions of your access token and can run read queries against the data sources in that workspace. Because an agent's exploration is not deterministic and depends on the model you use, assume that any data reachable from that workspace may be read while it works. Scope the token to a workspace you are comfortable exposing.
:::

:::note Token Usage
The number of tokens consumed by an operation depends on the model you select, its reasoning effort setting, and the complexity of the request. These tokens are billed by your AI client's model provider, not by ToolJet.
:::

## Benefits of Using ToolJet MCP

- **No ToolJet credits**: Operations run on your AI client's own model subscription, so building through MCP doesn't draw down your ToolJet AI credits.
- **Better output**: Agents build against ToolJet's governed first-party contracts, so they work from the platform's real schemas instead of guessing at its internals.
- **Stays in your workflow**: Create and modify apps from the editor you already work in, with no context switching into ToolJet.
- **Browser-tested**: Agents with browser access can open the app they built and verify it actually works before handing it back.
- **Extensible**: Pair ToolJet MCP with other skills, tools, and MCP servers to extend what your agent can do.
