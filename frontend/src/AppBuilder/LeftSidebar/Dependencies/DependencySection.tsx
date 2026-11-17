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

  return (
    <div className="dependency-section">
      <PanelSectionHeader
        className="dependency-section-header"
        title={title}
        count={count}
        open={isOpen}
        onToggle={() => setExpanded((prev) => !prev)}
        dataCy={dataCy ?? `dependency-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      />
      {isOpen && <div className="dependency-section-body">{children}</div>}
    </div>
  );
};

export default DependencySection;
