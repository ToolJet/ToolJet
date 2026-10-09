import React from 'react';

/**
 * "Recommended" pill for provider pickers.
 *
 * Shared between the admin LLM key page and the builder's Session Overview panel so
 * the shape and metrics cannot drift. The two differ only in colour: the admin page
 * uses the accent treatment, the builder panel the neutral one per its design.
 *
 * Inline styles rather than Tailwind because one caller lives inside react-select's
 * option renderer, which styles everything this way. Literal rgba rather than the
 * interactive-* tokens because both callers render inside portals, where those tokens
 * fall back to their much weaker :root values.
 */
const VARIANTS = {
  accent: {
    color: 'var(--primary-accent-strong)',
    background: { light: '#ecf0fe', dark: 'rgba(74,109,217,0.2)' },
  },
  neutral: {
    color: 'var(--text-placeholder)',
    background: { light: 'rgba(172,178,185,0.24)', dark: 'rgba(161,167,174,0.16)' },
  },
};

export default function RecommendedTag({ darkMode = false, label = 'Recommended', variant = 'accent' }) {
  const { color, background } = VARIANTS[variant] ?? VARIANTS.accent;

  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 500,
        color,
        backgroundColor: darkMode ? background.dark : background.light,
        borderRadius: '9999px',
        padding: '1px 6px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
