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

export default function ClientLogo({ name }) {
  const clientName = typeof name === 'string' ? name.trim() : '';
  // Exact known aliases only: a client name containing a brand is still unknown.
  // This is decorative, not proof of identity; consent retains its disclosure.
  const Logo = CLIENT_LOGOS.get(clientName.toLowerCase().replace(/\s+/g, ' '));

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
