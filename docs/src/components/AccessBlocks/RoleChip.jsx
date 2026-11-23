import React from 'react';
import clsx from 'clsx';
import ICONS from '../DocBlocks/icons';
import './AccessBlocks.css';

export const ROLE_TONES = ['violet', 'blue', 'teal', 'slate', 'amber'];

/** The tone class for a role; unknown tones fall back to slate. */
export function roleToneClass(role) {
  const tone = ROLE_TONES.includes(role?.tone) ? role.tone : 'slate';
  return `accblk-role--${tone}`;
}

/** A role's name in its colour, with its icon. Never colour alone: the name is always shown. */
export default function RoleChip({ role, className }) {
  if (!role) return null;
  const Icon = ICONS[role.icon];
  return (
    <span className={clsx('accblk-role', roleToneClass(role), className)}>
      {Icon && <Icon aria-hidden="true" />}
      {role.label}
    </span>
  );
}
