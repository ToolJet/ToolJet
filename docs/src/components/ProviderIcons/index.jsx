import React from 'react';
import Anthropic from './Anthropic';
import DeepSeek from './DeepSeek';
import Gemini from './Gemini';
import Grok from './Grok';
import OpenAI from './OpenAI';

// Provider marks copied from the ToolJet AI builder (frontend/ee/.../SessionOverview/ProviderIcons) so the docs match
// the product. The monochrome marks follow the text colour, so they work in light and dark mode.
const ICONS = { anthropic: Anthropic, openai: OpenAI, gemini: Gemini, deepseek: DeepSeek, grok: Grok };

export default function ProviderIcon({ provider, size = 16 }) {
  const Icon = ICONS[provider];
  if (!Icon) return null;
  return (
    <span style={{ display: 'inline-flex', verticalAlign: '-0.15em', marginRight: '0.45em' }}>
      <Icon size={size} />
    </span>
  );
}

// "Model name" with its provider mark in front.
export function ModelName({ provider, children, bold = true }) {
  const name = bold ? <strong>{children}</strong> : children;
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <ProviderIcon provider={provider} />
      {name}
    </span>
  );
}
