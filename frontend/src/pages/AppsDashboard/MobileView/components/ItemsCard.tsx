import React from 'react';

interface ItemsCardProps {
  /** Omitted for a card with no section heading, e.g. a folder's apps. */
  label?: string;
  children: React.ReactNode;
}

// A labelled section: the label sits above a rounded card of divided rows.
export function ItemsCard({ label, children }: ItemsCardProps) {
  return (
    <section>
      {label && <h2 className="tw-m-0 tw-mb-1 tw-font-title-large tw-text-text-default">{label}</h2>}
      <ul className="tw-m-0 tw-list-none tw-overflow-hidden tw-rounded-lg tw-bg-background-surface-layer-01 tw-p-0 tw-shadow-elevation-100 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-border-weak">
        {children}
      </ul>
    </section>
  );
}
