import React from 'react';
import clsx from 'clsx';
import { Check, CircleCheck, Minus, X } from 'lucide-react';
import './AccessBlocks.css';

/**
 * The state vocabulary of the permission blocks. A cell in the data is a
 * state id ('always', 'default', 'never', 'na') or `{ state, note }`, where
 * `note` is a short qualifier shown after the chip, such as "View only".
 */
export const STATES = {
  always: {
    label: 'Always',
    Icon: Check,
    legend: 'Comes with the role and cannot be removed.',
  },
  default: {
    label: 'On by default',
    Icon: CircleCheck,
    legend:
      "The role's default group starts with it. An admin can turn it off for that group, or grant it to a custom group.",
  },
  never: {
    label: 'Never',
    Icon: X,
    legend: 'Cannot be given to this role, even through a custom group.',
  },
  na: {
    label: 'Not applicable',
    Icon: Minus,
    legend: null,
  },
};

/** `'always'` or `{ state: 'always', note: 'View only' }` → `{ state, note }`. Unknown ids become `na`. */
export function normalizeState(value) {
  const raw = value && typeof value === 'object' ? value : { state: value };
  const state = STATES[raw.state] ? raw.state : 'na';
  return { state, note: raw.note };
}

/** One state as a chip (icon + text), with its qualifier after it. `labels` renames states, e.g. `{ always: 'Yes' }`. */
export default function StateChip({ value, labels = {} }) {
  const { state, note } = normalizeState(value);
  const { Icon, label } = STATES[state];
  const text = labels[state] ?? label;
  return (
    <span className="accblk-state-wrap">
      <span className={clsx('accblk-state', `accblk-state--${state}`)}>
        <Icon aria-hidden="true" />
        {text}
      </span>
      {note && <span className="accblk-state__note">{note}</span>}
    </span>
  );
}
