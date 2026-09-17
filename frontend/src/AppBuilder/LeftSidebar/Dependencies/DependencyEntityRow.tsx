import React from 'react';
import { decodeEntities } from '@/_helpers/utils';
import { activateOnEnterOrSpace } from '@/AppBuilder/Shared/EntityUsage/keyboard';
import BindingTooltip from './BindingTooltip';
import type { RowTooltip } from './types';

// Wraps every case-insensitive occurrence of `term` in a <mark> so the reason a row
// survived the search is visible.
const withHighlight = (text: string, term?: string): React.ReactNode => {
  if (!term) return text;
  const needle = term.toLowerCase();
  const haystack = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let at = haystack.indexOf(needle);
  while (at !== -1) {
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <mark className="dependency-row-highlight" key={`${at}-${needle}`}>
        {text.slice(at, at + needle.length)}
      </mark>
    );
    cursor = at + needle.length;
    at = haystack.indexOf(needle, cursor);
  }
  if (cursor === 0) return text;
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

/**
 * One entity row. Compact (single line) on the main tab's query/variable lists;
 * stacked (name + type + relationship tags) for components and every detail row.
 */
export type DependencyEntityRowProps = {
  icon?: React.ReactNode;
  name: string;
  subtitle?: string;
  tags?: string[];
  tooltip?: RowTooltip;
  highlight?: string;
  selected?: boolean;
  onClick?: () => void;
  dataCy?: string;
  /** Forwarded to the portalled tooltip, which cannot inherit the panel's theme class. */
  darkMode?: boolean;
};

export const DependencyEntityRow = ({
  icon,
  name,
  subtitle,
  tags = [],
  tooltip,
  highlight,
  selected = false,
  onClick,
  dataCy,
  darkMode = false,
}: DependencyEntityRowProps) => {
  const stacked = Boolean(subtitle) || tags.length > 0;
  const label = decodeEntities(name);

  const row = (
    <div
      className={`dependency-row ${stacked ? 'stacked' : 'compact'} ${onClick ? 'clickable' : ''} ${
        selected ? 'selected' : ''
      }`}
      onClick={onClick}
      onKeyDown={activateOnEnterOrSpace(onClick)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-cy={dataCy}
    >
      <span className="dependency-row-icon">{icon}</span>
      <span className="dependency-row-content">
        <span className="dependency-row-name text-truncate">{withHighlight(label, highlight)}</span>
        {subtitle && <span className="dependency-row-subtitle text-truncate">{subtitle}</span>}
        {tags.map((tag, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <span className="dependency-row-tag" key={`${tag}-${index}`}>
            {tag}
          </span>
        ))}
      </span>
    </div>
  );

  if (!tooltip) return row;
  return (
    <BindingTooltip id={tooltip.id} title={tooltip.title} bindings={tooltip.bindings} darkMode={darkMode}>
      {row}
    </BindingTooltip>
  );
};

export default DependencyEntityRow;
