import React from 'react';
import cx from 'classnames';
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

const Glyph = ({ status }) => (
  <span className={cx('vd-glyph', `vd-glyph--${status}`)} aria-label={STATUS_WORD[status]}>
    <svg viewBox="0 0 12 12" aria-hidden="true">
      {status !== 'changed' && <path d="M3 6h6" />}
      {status === 'added' && <path d="M6 3v6" />}
      {status === 'changed' && <circle cx="6" cy="6" r="2.2" />}
    </svg>
  </span>
);

const ChangeLines = ({ changes = [], events = [], note }) => (
  <ul className="vd-lines">
    {note && <li className="vd-line vd-line--note">{note}</li>}
    {changes.map((change, index) => {
      const Icon = GROUP_ICON[change.group] ?? SlidersHorizontal;
      return (
        <li key={`${change.path}-${index}`} className="vd-line">
          <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
          <span>{change.summary}</span>
        </li>
      );
    })}
    {events.map((event) => (
      <li key={event.key} className={cx('vd-line', `vd-line--${event.status}`)}>
        <Zap size={13} strokeWidth={1.75} aria-hidden="true" />
        <span>{event.summary}</span>
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
  const pagesTouched = diff.pages.length;
  const visible = (status) => filter === 'all' || filter === status;

  const headline = diff.identical
    ? `${versions.target} matches ${versions.base}`
    : totalComponents
    ? `${totalComponents} component${totalComponents === 1 ? '' : 's'} changed on ${pagesTouched} page${
        pagesTouched === 1 ? '' : 's'
      }`
    : 'No component changes';

  const extras = [
    pages.added && `${pages.added} page${pages.added === 1 ? '' : 's'} added`,
    pages.removed && `${pages.removed} page${pages.removed === 1 ? '' : 's'} removed`,
    queries.added + queries.changed + queries.removed &&
      `${queries.added + queries.changed + queries.removed} quer${
        queries.added + queries.changed + queries.removed === 1 ? 'y' : 'ies'
      } changed`,
    diff.settings.length && `${diff.settings.length} app setting${diff.settings.length === 1 ? '' : 's'} changed`,
  ].filter(Boolean);

  return (
    <aside className="vd-rail" aria-label="Changes">
      <div className="vd-rail__summary">
        <p className="vd-rail__headline">{headline}</p>
        {extras.length > 0 && <p className="vd-rail__extras">{extras.join(', ')}</p>}
        {!diff.identical && (
          <div className="vd-filters" role="radiogroup" aria-label="Filter changes">
            {['all', 'added', 'changed', 'removed'].map((status) => {
              const n = status === 'all' ? totalComponents : components[status];
              // The glyphs are the legend for every row below, so the segments carry the glyph and
              // the count; the word is the accessible name and the tooltip.
              const word = status === 'all' ? 'All changes' : STATUS_WORD[status];
              return (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={filter === status}
                  aria-label={`${word}, ${n}`}
                  title={word}
                  className={cx('vd-filter', `vd-filter--${status}`, { 'vd-filter--on': filter === status })}
                  onClick={() => onFilter(status)}
                  disabled={status !== 'all' && n === 0}
                >
                  {status === 'all' ? <span className="vd-filter__all">All</span> : <Glyph status={status} />}
                  <span className="vd-filter__n">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="vd-rail__scroll">
        {diff.settings.length > 0 && filter === 'all' && (
          <section className="vd-section">
            <h3 className="vd-section__title">App</h3>
            <ChangeLines changes={diff.settings} />
          </section>
        )}

        {diff.pages.map((page) => {
          const rows = page.components.filter((component) => visible(component.status));
          const isCurrent = page.key === pageKey;
          return (
            <section key={page.key} className={cx('vd-section', { 'vd-section--current': isCurrent })}>
              <button
                type="button"
                className="vd-page"
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onPageSelect(page.key)}
              >
                <FileText size={14} strokeWidth={1.75} aria-hidden="true" />
                <span className="vd-page__name">{page.name}</span>
                {page.status !== 'changed' && (
                  <span className={cx('vd-tag', `vd-tag--${page.status}`)}>{STATUS_WORD[page.status]}</span>
                )}
                <span className="vd-page__counts">
                  {page.counts.added > 0 && <span className="vd-count vd-count--added">+{page.counts.added}</span>}
                  {page.counts.changed > 0 && (
                    <span className="vd-count vd-count--changed">~{page.counts.changed}</span>
                  )}
                  {page.counts.removed > 0 && (
                    <span className="vd-count vd-count--removed">−{page.counts.removed}</span>
                  )}
                </span>
              </button>
              {(page.changes.length > 0 || page.events.length > 0) && filter === 'all' && (
                <ChangeLines changes={page.changes} events={page.events} />
              )}
              <ul className="vd-rows">
                {rows.map((component) => {
                  const isSelected = component.key === selectedKey;
                  const count = component.changes.length + component.events.length;
                  return (
                    <li key={component.key}>
                      <button
                        type="button"
                        className={cx('vd-row', `vd-row--${component.status}`, {
                          'vd-row--selected': isSelected,
                          'vd-row--hovered': component.key === hoveredKey,
                        })}
                        aria-expanded={isSelected}
                        onClick={() => onSelect(isSelected ? null : component.key, page.key)}
                        onMouseEnter={() => onHover(component.key)}
                        onMouseLeave={() => onHover(null)}
                      >
                        <Glyph status={component.status} />
                        <span className="vd-row__name">{component.name}</span>
                        <span className="vd-row__type">{typeLabel(component.type)}</span>
                        {commentCounts[component.key] > 0 && (
                          <span
                            className="vd-row__comments"
                            title={`${commentCounts[component.key]} comment${
                              commentCounts[component.key] === 1 ? '' : 's'
                            }`}
                          >
                            <MessageSquare size={11} strokeWidth={2} aria-hidden="true" />
                            {commentCounts[component.key]}
                          </span>
                        )}
                        {component.status === 'changed' && <span className="vd-row__n">{count}</span>}
                      </button>
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
                  <li className="vd-rows__empty">Nothing {filter} on this page</li>
                )}
              </ul>
            </section>
          );
        })}

        {diff.queries.length > 0 && (
          <section className="vd-section">
            <h3 className="vd-section__title">Queries</h3>
            <ul className="vd-rows">
              {diff.queries
                .filter((query) => visible(query.status))
                .map((query) => {
                  const key = `query:${query.key}`;
                  const isSelected = key === selectedKey;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        className={cx('vd-row', `vd-row--${query.status}`, { 'vd-row--selected': isSelected })}
                        aria-expanded={isSelected}
                        onClick={() => onSelect(isSelected ? null : key)}
                      >
                        <Glyph status={query.status} />
                        <span className="vd-row__name">{query.name}</span>
                        <span className="vd-row__type">{query.dataSource}</span>
                      </button>
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
