import React, { useState } from 'react';
import { AppWindow, Blocks, TriangleAlert, Workflow } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Rocket/Collapsible/Collapsible';

// Backend app type enum ('front-end' | 'module' | 'workflow') -> row icon.
const TYPE_ICON = { 'front-end': AppWindow, module: Blocks, workflow: Workflow };

// "N resources depend on this table" as a collapsed card that opens into the list (Figma Dependencies). A floor, never
// "will break": the backend only sees query references, not a table id hardcoded in a RunJS query.
// The migration dialog's version of DependentsWarning, which Delete table still uses.
export default function MigrationDependents({ loading, dependents }) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder" data-cy="migration-deps-loading">
        Checking dependent resources…
      </p>
    );
  }
  if (!dependents || dependents.count < 1) return null;

  const { count, dependents: listed = [] } = dependents;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="tw-shrink-0" data-cy="migration-deps-warning">
      <CollapsibleTrigger className="!tw-px-3 !tw-py-[7px] tw-gap-1.5 tw-border-0">
        <TriangleAlert aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-warning" />
        <span className="tw-flex-1 tw-text-left">
          {count} resource{count === 1 ? ' depends' : 's depend'} on this table
        </span>
      </CollapsibleTrigger>
      {/* No display class on the content itself: it is a grid whose rows collapse to 0, so the list lays out inside. */}
      <CollapsibleContent className="tw-px-3 tw-pb-3">
        <div className="tw-flex tw-flex-col">
          {listed.map((dependent) => {
            const Icon = TYPE_ICON[dependent.type] ?? AppWindow;
            return (
              <div key={dependent.id} className="tw-flex tw-h-8 tw-items-center tw-gap-1.5 tw-px-2">
                <Icon aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-weak" />
                <span className="tw-truncate tw-font-body-default tw-text-text-default">
                  {dependent.name || 'Untitled'}
                </span>
              </div>
            );
          })}
          {count > listed.length && (
            <div className="tw-px-2 tw-py-1.5 tw-font-body-default tw-text-text-placeholder">
              +{count - listed.length} more
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
