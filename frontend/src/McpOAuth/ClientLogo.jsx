import React from 'react';
import Anthropic from './clientLogos/Anthropic';
import Claude from './clientLogos/Claude';
import OpenAI from './clientLogos/OpenAI';
import Codex from './clientLogos/Codex';
import Gemini from './clientLogos/Gemini';
import Grok from './clientLogos/Grok';

// These bundled marks also appear in the AI provider picker. Keep this public
// route independent of enterprise modules and remote image services.
const CLIENT_LOGOS = new Map([
  ['anthropic', Anthropic],
  ['claude', Claude],
  ['claude desktop', Claude],
  ['claude code', Claude],
  ['claude-code', Claude],
  ['claude.ai', Claude],
  ['claude.com', Claude],
  ['chatgpt', OpenAI],
  ['chat gpt', OpenAI],
  ['openai', OpenAI],
  ['openai chatgpt', OpenAI],
  ['codex', Codex],
  ['codex cli', Codex],
  ['openai codex', Codex],
  ['gemini', Gemini],
  ['gemini cli', Gemini],
  ['google gemini', Gemini],
  ['grok', Grok],
  ['xai', Grok],
  ['xai grok', Grok],
]);

const CLAUDE_CALLBACKS = new Set([
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
]);

export default function ClientLogo({ name, redirectUri }) {
  const clientName = typeof name === 'string' ? name.trim() : '';
  const normalizedName = clientName.toLowerCase().replace(/\s+/g, ' ');
  // Claude Code registers as "Claude Code (<server name>)". Match that complete
  // format, not arbitrary names containing a brand. Hosted Claude can also use
  // a custom registration name with its documented, exact OAuth callback.
  // These marks are decorative, not identity verification; keep the disclosure.
  const Logo =
    CLIENT_LOGOS.get(normalizedName) ||
    (/^claude code \([^()]+\)$/.test(normalizedName) || CLAUDE_CALLBACKS.has(redirectUri) ? Claude : null);

  return (
    <span className="mcp-oauth-connection-logo mcp-oauth-client-logo" aria-hidden="true">
      {Logo ? (
        <Logo size={32} />
      ) : (
        <span className="mcp-oauth-client-monogram">{Array.from(clientName)[0]?.toUpperCase() || '?'}</span>
      )}
    </span>
  );
}
