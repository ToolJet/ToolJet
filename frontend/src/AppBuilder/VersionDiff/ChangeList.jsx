import React from 'react';
import { cn } from '@/lib/utils';
import {
  Database,
  EyeOff,
  Move,
  Palette,
  Settings2,
  SlidersHorizontal,
  Zap,
  FileText,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/Rocket';
import { Counts, StatusDot, Tag, STATUS_TONE } from './ui';

export const STATUS_WORD = { added: 'Added', changed: 'Changed', removed: 'Removed' };

// Widget type names carry implementation prefixes (ShadStat, DatePickerV2).
export const typeLabel = (type = '') =>
  type
    .replace(/^Shad(?=[A-Z])/, '')
    .replace(/V\d+$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2');

const GROUP_ICON = {
  layout: Move,
  parent: Layers,
  property: SlidersHorizontal,
  general: SlidersHorizontal,
  validation: SlidersHorizontal,
  style: Palette,
  display: EyeOff,
  type: Layers,
  page: FileText,
  query: Database,
  settings: Settings2,
  event: Zap,
};

const ChangeLines = ({ changes = [], events = [], note, inset = true }) => (
  <ul
    className={cn(
      'vd-lines tw-m-0 tw-list-none tw-flex tw-flex-col tw-gap-1.5 tw-pr-4 tw-pt-1 tw-pb-2',
      inset ? 'tw-pl-[34px]' : 'tw-pl-4'
    )}
  >
    {note && <li className="tw-font-body-small tw-text-text-placeholder">{note}</li>}
    {changes.map((change, index) => {
      const Icon = GROUP_ICON[change.group] ?? SlidersHorizontal;
      return (
        <li key={`${change.path}-${index}`} className="vd-line tw-flex tw-gap-2 tw-font-body-small tw-text-text-medium">
          <Icon size={12} strokeWidth={1.75} className="tw-shrink-0 tw-mt-[3px] tw-text-icon-weak" aria-hidden="true" />
          <span className="tw-min-w-0 tw-break-words">{change.summary}</span>
        </li>
      );
    })}
    {events.map((event) => (
      <li key={event.key} className="vd-line tw-flex tw-gap-2 tw-font-body-small tw-text-text-medium">
        <Zap size={12} strokeWidth={1.75} className="tw-shrink-0 tw-mt-[3px] tw-text-icon-weak" aria-hidden="true" />
        <span className="tw-min-w-0 tw-break-words">{event.summary}</span>
      </li>
    ))}
  </ul>
);

const componentNote = (component, versions) => {
  if (component.status === 'added')
    return `New in ${versions.target}${component.parent.target ? `, inside ${component.parent.target}` : ''}`;
  if (component.status === 'removed')
    return `Only in ${versions.base}${component.parent.base ? `, was inside ${component.parent.base}` : ''}`;
  return null;
};

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const Row = ({ status, name, type, selected, hovered, comments, onClick, onMouseEnter, onMouseLeave }) => (
  <button
    type="button"
    className={cn(
      'vd-plain vd-row tw-flex tw-items-center tw-gap-2 tw-h-8 tw-mx-2 tw-px-2 tw-rounded-md tw-w-[calc(100%-16px)]',
      'hover:tw-bg-interactive-hover',
      {
        'tw-bg-interactive-hover': hovered && !selected,
        'tw-bg-interactive-selected hover:tw-bg-interactive-selected': selected,
      }
    )}
    aria-expanded={selected}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <StatusDot status={status} />
    <span
      className={cn('tw-min-w-0 tw-truncate tw-font-body-default tw-text-text-default', {
        'tw-text-text-placeholder tw-line-through': status === 'removed',
      })}
    >
      {name}
    </span>
    <span className="tw-ml-auto tw-shrink-0 tw-font-body-small tw-text-text-placeholder">{type}</span>
    {comments > 0 && (
      <span
        className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-0.5 tw-font-body-small tw-text-text-brand"
        title={plural(comments, 'comment')}
      >
        <MessageSquare size={11} strokeWidth={2} aria-hidden="true" />
        {comments}
      </span>
    )}
  </button>
);

export const ChangeList = ({
  diff,
  filter,
  onFilter,
  pageKey,
  onPageSelect,
  selectedKey,
  onSelect,
  hoveredKey,
  onHover,
  hiddenKeys,
  commentCounts = {},
}) => {
  const versions = { base: diff.base.name, target: diff.target.name };
  const { components, queries, pages } = diff.summary;
  const totalComponents = components.added + components.changed + components.removed;
  const changedQueries = queries.added + queries.changed + queries.removed;
  const visible = (status) => filter === 'all' || filter === status;

  const headline = diff.identical
    ? `${versions.target} matches ${versions.base}`
    : totalComponents
    ? `${plural(totalComponents, 'component')} changed on ${plural(diff.pages.length, 'page')}`
    : 'No component changes';

  const extras = [
    pages.added && `${plural(pages.added, 'page')} added`,
    pages.removed && `${plural(pages.removed, 'page')} removed`,
    changedQueries && `${plural(changedQueries, 'query', 'queries')} changed`,
    diff.settings.length && `${plural(diff.settings.length, 'app setting')} changed`,
  ].filter(Boolean);

  return (
    <aside
      className="vd-rail tw-flex tw-flex-col tw-min-h-0 tw-bg-background-surface-layer-01 tw-border-0 tw-border-r tw-border-solid tw-border-border-weak"
      aria-label="Changes"
    >
      <div className="vd-rail__summary tw-flex tw-flex-col tw-gap-3 tw-px-4 tw-py-3 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <p className="tw-m-0 tw-font-title-default tw-text-text-default">{headline}</p>
          {extras.length > 0 && (
            <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">Also {extras.join(', ')}</p>
          )}
        </div>
        {!diff.identical && (
          <ToggleGroup
            type="single"
            size="medium"
            value={filter}
            onValueChange={(value) => value && onFilter(value)}
            className="tw-w-full"
            aria-label="Filter changes"
          >
            {['all', 'added', 'changed', 'removed'].map((status) => {
              const n = status === 'all' ? totalComponents : components[status];
              return (
                <ToggleGroupItem
                  key={status}
                  value={status}
                  className="vd-filter tw-flex-auto tw-gap-1 tw-px-2"
                  disabled={status !== 'all' && n === 0}
                  aria-label={`${status === 'all' ? 'All' : STATUS_WORD[status]}, ${n}`}
                  data-tip={status === 'all' ? undefined : STATUS_WORD[status]}
                >
                  {status === 'all' ? (
                    'All'
                  ) : (
                    <>
                      {/* The word when the rail has room, the list's own dot when it does not. */}
                      <StatusDot status={status} className="vd-filter__dot" />
                      <span className="vd-filter__word">{STATUS_WORD[status]}</span>
                    </>
                  )}
                  <span className="tw-text-text-placeholder">{n}</span>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        )}
      </div>

      <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto tw-py-2">
        {diff.settings.length > 0 && filter === 'all' && (
          <section className="tw-pb-2">
            <h3 className="tw-m-0 tw-px-4 tw-py-1.5 tw-font-title-small tw-text-text-placeholder">App</h3>
            <ChangeLines changes={diff.settings} inset={false} />
          </section>
        )}

        {diff.pages.map((page) => {
          const rows = page.components.filter((component) => visible(component.status));
          const isCurrent = page.key === pageKey;
          return (
            <section key={page.key} className="tw-pb-2">
              <button
                type="button"
                className="vd-plain vd-page tw-flex tw-items-center tw-gap-2 tw-w-full tw-h-8 tw-px-4"
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onPageSelect(page.key)}
              >
                <FileText
                  size={14}
                  strokeWidth={1.75}
                  className={cn('tw-shrink-0', isCurrent ? 'tw-text-icon-brand' : 'tw-text-icon-weak')}
                  aria-hidden="true"
                />
                <span className="tw-min-w-0 tw-truncate tw-font-title-default tw-text-text-default">{page.name}</span>
                {page.status !== 'changed' && <Tag tone={STATUS_TONE[page.status]}>{STATUS_WORD[page.status]}</Tag>}
                <Counts counts={page.counts} className="tw-ml-auto" />
              </button>
              {(page.changes.length > 0 || page.events.length > 0) && filter === 'all' && (
                <ChangeLines changes={page.changes} events={page.events} />
              )}
              <ul className="tw-m-0 tw-p-0 tw-list-none">
                {rows.map((component) => {
                  const isSelected = component.key === selectedKey;
                  return (
                    <li key={component.key}>
                      <Row
                        status={component.status}
                        name={component.name}
                        type={typeLabel(component.type)}
                        selected={isSelected}
                        hovered={component.key === hoveredKey}
                        comments={commentCounts[component.key]}
                        onClick={() => onSelect(isSelected ? null : component.key, page.key)}
                        onMouseEnter={() => onHover(component.key)}
                        onMouseLeave={() => onHover(null)}
                      />
                      {isSelected && (
                        <ChangeLines
                          changes={component.changes}
                          events={component.events}
                          note={
                            componentNote(component, versions) ??
                            (hiddenKeys?.has(component.key) ? 'Not visible in this render' : null)
                          }
                        />
                      )}
                    </li>
                  );
                })}
                {rows.length === 0 && page.components.length > 0 && (
                  <li className="tw-px-4 tw-py-1.5 tw-font-body-small tw-text-text-placeholder">
                    Nothing {filter} on this page
                  </li>
                )}
              </ul>
            </section>
          );
        })}

        {diff.queries.length > 0 && (
          <section className="tw-pb-2">
            <h3 className="tw-m-0 tw-px-4 tw-py-1.5 tw-font-title-small tw-text-text-placeholder">Queries</h3>
            <ul className="tw-m-0 tw-p-0 tw-list-none">
              {diff.queries
                .filter((query) => visible(query.status))
                .map((query) => {
                  const key = `query:${query.key}`;
                  const isSelected = key === selectedKey;
                  return (
                    <li key={key}>
                      <Row
                        status={query.status}
                        name={query.name}
                        type={query.dataSource}
                        selected={isSelected}
                        onClick={() => onSelect(isSelected ? null : key)}
                      />
                      {isSelected && (
                        <ChangeLines
                          changes={query.changes}
                          events={query.events}
                          note={
                            query.status === 'added'
                              ? `New in ${versions.target}`
                              : query.status === 'removed'
                              ? `Only in ${versions.base}`
                              : null
                          }
                        />
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
};

export default ChangeList;
