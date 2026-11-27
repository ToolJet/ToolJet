import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import { Input } from '@/components/ui/Rocket/Input/Input';
import EmptyState from '@/pages/components/EmptyState';
import { WorkspaceSwitchBranchModal } from '@/_ui/WorkspaceBranchDropdown/SwitchBranchModal';

import { filterSections, type CatalogItem, type SectionId } from './catalog';
import DataSourceCard from './DataSourceCard';
import { SECTION_META, type PillId } from './sectionMeta';
import { useDataSourceCatalog } from './useDataSourceCatalog';
import { useDataSourceCreation } from './useDataSourceCreation';

const NO_PERMISSION_MESSAGE = 'You do not have permission to add a data source';
// Smooth scrolling reports every section it passes; ignore those until it lands or this long passes.
const PROGRAMMATIC_SCROLL_MS = 800;
// Pixels of slack so a section whose top is just under the list's top still counts as current.
const ACTIVE_SECTION_OFFSET = 8;

interface SelectDataSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the data source the server created. */
  onCreated?: (dataSource: unknown) => void;
  /** Called from the no-results state. */
  onRequestDataSource?: () => void;
}

export default function SelectDataSourceDialog({
  open,
  onOpenChange,
  onCreated,
  onRequestDataSource,
}: SelectDataSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="tw-h-[44.25rem] tw-max-h-[calc(100dvh-2rem)] tw-max-w-[66rem] tw-overflow-hidden"
      >
        {/* Mounted only while open, so search and scroll position reset on every open. */}
        <SelectDataSourceContent
          onClose={() => onOpenChange(false)}
          onCreated={onCreated}
          onRequestDataSource={onRequestDataSource}
        />
      </DialogContent>
    </Dialog>
  );
}

interface SelectDataSourceContentProps {
  onClose: () => void;
  onCreated?: (dataSource: unknown) => void;
  onRequestDataSource?: () => void;
}

function SelectDataSourceContent({ onClose, onCreated, onRequestDataSource }: SelectDataSourceContentProps) {
  const [query, setQuery] = useState('');
  const [activePill, setActivePill] = useState<PillId>('all');
  const [pendingItem, setPendingItem] = useState<CatalogItem | null>(null);
  const [showSwitchBranchModal, setShowSwitchBranchModal] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});
  const scrollTargetRef = useRef<PillId | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { sections, isLoading, canUseMarketplace } = useDataSourceCatalog(true);

  const handleCreated = useCallback(
    (dataSource: unknown) => {
      onClose();
      onCreated?.(dataSource);
    },
    [onClose, onCreated]
  );
  const { createDataSource, isCreating, hasCreatePermission, isGitLicenseLocked, isWorkspaceBranchLocked } =
    useDataSourceCreation({ onCreated: handleCreated });

  const visibleSections = useMemo(() => filterSections(sections, query), [sections, query]);
  const visibleIds = useMemo(() => new Set(visibleSections.map((section) => section.id)), [visibleSections]);

  const handleConnect = (item: CatalogItem) => {
    if (isGitLicenseLocked) return;
    setPendingItem(item);
    if (isWorkspaceBranchLocked) {
      setShowSwitchBranchModal(true);
      return;
    }
    createDataSource(item.source);
  };

  const openMarketplace = () => window.open('/integrations/marketplace', '_blank');

  const handlePillClick = (id: PillId) => {
    // Search can leave no sections; the pills stay as designed but have nothing to scroll to.
    if (id !== 'all' && !sectionRefs.current[id]) return;
    setActivePill(id);
    scrollTargetRef.current = id;
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => (scrollTargetRef.current = null), PROGRAMMATIC_SCROLL_MS);

    if (id === 'all') {
      listRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
      return;
    }
    sectionRefs.current[id]?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  const handleListScroll = () => {
    const list = listRef.current;
    if (!list) return;

    const listTop = list.getBoundingClientRect().top;
    let current: PillId = 'all';
    for (const section of visibleSections) {
      const top = sectionRefs.current[section.id]?.getBoundingClientRect().top;
      if (top !== undefined && top - listTop <= ACTIVE_SECTION_OFFSET) current = section.id;
    }

    if (scrollTargetRef.current) {
      if (current !== scrollTargetRef.current) return;
      scrollTargetRef.current = null;
    }
    setActivePill(current);
  };

  const pills: { id: PillId; label: string }[] = [
    { id: 'all', label: 'All' },
    ...sections.map(({ id, label }) => ({ id, label })),
  ];

  return (
    <>
      {canUseMarketplace && (
        <div className="tw-flex tw-h-11 tw-shrink-0 tw-items-center tw-justify-center tw-gap-3 tw-bg-ai-banner">
          <p className="tw-m-0 tw-font-body-default tw-text-text-default">
            Can’t find what you’re looking for? Explore the marketplace to add more plugins.
          </p>
          <Button
            isLucid
            variant="secondary"
            size="medium"
            leadingIcon="store"
            onClick={openMarketplace}
            data-cy="explore-marketplace-button"
          >
            Explore Marketplace
          </Button>
        </div>
      )}

      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-6 tw-px-8 tw-pt-6">
        <header className="tw-flex tw-flex-col tw-items-start tw-gap-0.5">
          <div className="tw-flex tw-items-center tw-gap-3">
            <Button
              variant="ghost"
              iconOnly
              size="medium"
              aria-label="Back"
              className="tw-p-0 tw-size-auto"
              onClick={onClose}
            >
              <ArrowLeft className="tw-size-5 tw-text-icon-default" />
            </Button>

            <DialogTitle className="tw-font-inter tw-font-medium tw-text-[22px]">Select datasource</DialogTitle>
          </div>

          <DialogDescription className="tw-pl-8 tw-mb-0">
            Connect external tools to build apps, access data, and automate workflows.
          </DialogDescription>
        </header>

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
          <div role="group" aria-label="Jump to category" className="tw-flex tw-flex-wrap tw-gap-1">
            {pills.map(({ id, label }) => {
              const { icon: Icon, iconClass } = SECTION_META[id];
              const isActive = activePill === id;
              // A category pill is off while search has emptied its section, unless nothing matches at all.
              const isDisabled = id !== 'all' && visibleSections.length > 0 && !visibleIds.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isActive}
                  disabled={isDisabled}
                  onClick={() => handlePillClick(id)}
                  className={cn(
                    'tw-flex tw-h-[2.1rem] tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-bg-transparent tw-px-2 tw-font-title-default tw-text-text-default',
                    'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline',
                    'disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
                    isActive
                      ? 'tw-border-border-default tw-bg-interactive-default'
                      : 'tw-border-border-weak hover:tw-bg-interactive-hover'
                  )}
                >
                  <Icon className={cn('tw-size-3', iconClass)} aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="tw-relative tw-w-[20.25rem] tw-shrink-0">
            <Search
              className="tw-pointer-events-none tw-absolute tw-left-2 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-icon-default"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search data sources"
              className="tw-pl-8"
            />
          </div>
        </div>

        <div
          ref={listRef}
          onScroll={handleListScroll}
          className="tw-relative tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-hide-scrollbar tw-pb-6"
          data-cy="select-datasource-list"
        >
          {isLoading ? (
            <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder" role="status">
              Loading data sources…
            </p>
          ) : visibleSections.length === 0 ? (
            <EmptyState
              title="No datasources found"
              description={`We couldn’t find a datasource matching “${query.trim()}”. Check the spelling, try a different keyword, or explore the marketplace.`}
              icon={<Search size={20} />}
              classes={{
                root: 'tw-min-h-[25rem] tw-justify-center',
                title: 'tw-font-title-heavy-large',
                description: 'tw-max-w-[27.5rem] tw-text-text-medium',
                content: 'tw-mt-0',
              }}
              data-cy="select-datasource-no-results"
            >
              {canUseMarketplace && (
                <Button isLucid variant="outline" leadingIcon="store" onClick={openMarketplace}>
                  Explore marketplace
                </Button>
              )}
              <Button variant="outline" onClick={onRequestDataSource}>
                Request new datasource
              </Button>
            </EmptyState>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-5">
              {visibleSections.map(({ id, label, items }) => {
                const { icon: Icon } = SECTION_META[id];
                return (
                  <section
                    key={id}
                    ref={(node) => {
                      sectionRefs.current[id] = node;
                    }}
                    aria-labelledby={`select-ds-${id}`}
                    className="tw-flex tw-flex-col tw-gap-1"
                  >
                    <h2
                      id={`select-ds-${id}`}
                      className="tw-m-0 tw-flex tw-h-8 tw-items-center tw-gap-2 tw-px-2 tw-font-title-default tw-text-text-default"
                    >
                      <Icon className="tw-size-4 tw-text-icon-strong" aria-hidden />
                      {`${label} (${items.length})`}
                    </h2>
                    <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-3 tw-gap-4 tw-p-0">
                      {items.map((item) => (
                        <DataSourceCard
                          key={item.key}
                          item={item}
                          onConnect={handleConnect}
                          disabled={isCreating || !hasCreatePermission || isGitLicenseLocked}
                          disabledReason={hasCreatePermission ? undefined : NO_PERMISSION_MESSAGE}
                          isLoading={isCreating && pendingItem?.key === item.key}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showSwitchBranchModal && (
        <WorkspaceSwitchBranchModal
          show={showSwitchBranchModal}
          onClose={() => {
            setShowSwitchBranchModal(false);
            setPendingItem(null);
          }}
          onBranchSwitch={() => {
            setShowSwitchBranchModal(false);
            if (pendingItem) createDataSource(pendingItem.source);
          }}
        />
      )}
    </>
  );
}
