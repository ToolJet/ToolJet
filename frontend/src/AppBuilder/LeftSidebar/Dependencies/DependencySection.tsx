import React, { useState } from 'react';
import RawPanelSectionHeader from '@/AppBuilder/Shared/Panel/PanelSectionHeader';

// Untyped JS module — cast at the import site.
const PanelSectionHeader = RawPanelSectionHeader as React.ComponentType<any>;

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
  /** Trailing control in the header (e.g. an add button). Clicks on it don't toggle the section. */
  action?: React.ReactNode;
  /** Render even when `count` is 0, so `children` can show an empty state. */
  showWhenEmpty?: boolean;
};

export const DependencySection = ({
  title,
  count,
  defaultExpanded = true,
  forceExpanded = false,
  children,
  dataCy,
  action,
  showWhenEmpty = false,
}: DependencySectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (!count && !showWhenEmpty) return null;

  const isOpen = forceExpanded || expanded;

  return (
    <div className="dependency-section">
      <div className="dependency-section-heading tw-flex tw-items-center">
        <PanelSectionHeader
          className="dependency-section-header tw-flex-1 tw-min-w-0"
          title={title}
          count={count}
          open={isOpen}
          onToggle={() => setExpanded((prev) => !prev)}
          dataCy={dataCy ?? `dependency-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        />
        {action && <span className="dependency-section-action tw-pr-3">{action}</span>}
      </div>
      {isOpen && <div className="dependency-section-body">{children}</div>}
    </div>
  );
};

export default DependencySection;
