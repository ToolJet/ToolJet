import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { activateOnEnterOrSpace } from '@/AppBuilder/Shared/EntityUsage/keyboard';

/**
 * Top-level collapsible section of the Dependencies main tab
 * ("Runs on load (9)", "Queries (15)", …).
 *
 * Renders nothing when `count` is 0 — an entity kind with no relationships is
 * simply absent from the panel rather than shown as an empty group.
 * `forceExpanded` keeps sections open while a search is active, so a collapsed
 * section can never hide a match.
 */
export type DependencySectionProps = {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  forceExpanded?: boolean;
  children?: React.ReactNode;
  dataCy?: string;
};

export const DependencySection = ({
  title,
  count,
  defaultExpanded = true,
  forceExpanded = false,
  children,
  dataCy,
}: DependencySectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (!count) return null;

  const isOpen = forceExpanded || expanded;
  const Chevron = isOpen ? ChevronUpIcon : ChevronDownIcon;

  return (
    <div className="dependency-section">
      <div
        className="dependency-section-header"
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={activateOnEnterOrSpace(() => setExpanded((prev) => !prev))}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        data-cy={dataCy ?? `dependency-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className="dependency-section-chevron-box">
          <Chevron size={12} className="dependency-section-chevron" />
        </span>
        <span className="dependency-section-title">
          {title} ({count})
        </span>
      </div>
      {isOpen && <div className="dependency-section-body">{children}</div>}
    </div>
  );
};

export default DependencySection;
