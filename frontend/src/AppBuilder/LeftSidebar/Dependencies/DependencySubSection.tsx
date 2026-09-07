import React from 'react';

/**
 * Group header inside a section ("On app load", "Uses (2)", "Events").
 * `icon` is used on the detail tab only; the main tab passes none.
 * `count` is optional — Figma's "Events" header has no count.
 */
export type DependencySubSectionProps = {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  indent?: boolean;
  children?: React.ReactNode;
};

export const DependencySubSection = ({ title, count, icon, indent = false, children }: DependencySubSectionProps) => {
  const hasChildren = React.Children.toArray(children).some(Boolean);
  if (!hasChildren) return null;

  return (
    <div className="dependency-subsection">
      <div
        className="dependency-subsection-header"
        data-cy={`dependency-subsection-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {icon && <span className="dependency-subsection-icon">{icon}</span>}
        <span className="dependency-subsection-title">
          {title}
          {count !== undefined && ` (${count})`}
        </span>
      </div>
      <div className={`dependency-subsection-body ${indent ? 'indented' : ''}`}>{children}</div>
    </div>
  );
};

export default DependencySubSection;
