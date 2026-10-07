import React from 'react';
import { ArrowRightIcon, ChevronRightIcon, MousePointerClickIcon, SquareDashedMousePointerIcon } from 'lucide-react';
import { decodeEntities } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import DependencySubSection from './DependencySubSection';
import DependencyEntityRow from './DependencyEntityRow';
import { DatabaseArrowDownIcon, DatabaseArrowUpIcon, EntityIcon } from './entityIcons';
import {
  formatActionLabel,
  formatEventLabel,
  formatPropertyLabel,
  getComponentDisplayName,
} from './relationshipLabels';
import { activateOnEnterOrSpace } from '@/AppBuilder/Shared/EntityUsage/keyboard';
import type {
  DependencyEntry,
  DependencyEntryKind,
  DependencySelection,
  DetailGroup,
  DetailMenuItem,
  DetailSubject,
} from './types';

const usesIcon = <DatabaseArrowDownIcon size={16} className="dependency-subsection-lucide" />;
const usedByIcon = <DatabaseArrowUpIcon size={16} className="dependency-subsection-lucide" />;
const eventsIcon = <MousePointerClickIcon size={16} className="dependency-subsection-lucide" />;

const KIND_SUBTITLES: Partial<Record<DependencyEntryKind, string>> = {
  query: 'Query',
  variable: 'variable',
  pageVariable: 'page variable',
  global: 'global',
  constant: 'constant',
  page: 'Page',
  unknown: 'unknown',
};

const NAVIGABLE = new Set<string>(['query', 'component']);

export type DetailHeaderProps = {
  subject: DetailSubject;
  breadcrumbRoot: string;
  onNavigateRoot: () => void;
  menuItems: DetailMenuItem[];
  darkMode?: boolean;
};

/** Breadcrumb + kebab. Lives in the panel header so it stays put while the list scrolls. */
export const DetailHeader = ({ subject, breadcrumbRoot, onNavigateRoot, menuItems, darkMode }: DetailHeaderProps) => (
  <div className="dependency-breadcrumb-bar">
    <div className="dependency-breadcrumb">
      <span
        className="dependency-breadcrumb-root"
        role="button"
        tabIndex={0}
        onClick={onNavigateRoot}
        onKeyDown={activateOnEnterOrSpace(onNavigateRoot)}
      >
        {breadcrumbRoot}
      </span>
      <ChevronRightIcon size={12} className="dependency-breadcrumb-separator" />
      <span className="dependency-breadcrumb-leaf">
        {subject.icon}
        <span className="text-truncate" title={decodeEntities(subject.name)}>
          {decodeEntities(subject.name)}
        </span>
      </span>
    </div>
    <DetailMenu items={menuItems} darkMode={darkMode} />
  </div>
);

const truncate = (str: string, max: number) => (str.length > max ? `${str.slice(0, max)}…` : str);

const previewOf = (value: unknown): string => {
  if (value === undefined) return '—';
  try {
    const str = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
    return truncate(str ?? String(value), 120);
  } catch (e) {
    return truncate(String(value), 120);
  }
};

// Live value of the variable being viewed — subscribes directly so it stays current
// without re-running the whole dependency traversal.
type VariableValueProps = {
  moduleId: string;
  scope: 'app' | 'page';
  name: string;
};

const VariableValue = ({ moduleId, scope, name }: VariableValueProps) => {
  const value = useStore((state: any) => {
    const exposed = state.resolvedStore.modules[moduleId]?.exposedValues;
    return previewOf(scope === 'app' ? exposed?.variables?.[name] : exposed?.page?.variables?.[name]);
  });

  return (
    <div className="dependency-detail-value">
      <span className="dependency-detail-value-label">Current value</span>
      <span className="dependency-detail-value-text" title={value}>
        {value}
      </span>
    </div>
  );
};

export type DetailTabProps = {
  subject: DetailSubject;
  groups: DetailGroup[];
  moduleId: string;
  onSelect: (selection: DependencySelection) => void;
  /** Only needed for the portalled binding tooltip — see BindingTooltip. */
  darkMode?: boolean;
};

/**
 * Detail view for a single entity: who triggers it, what it uses, who uses it,
 * and the events it owns. Rows drill into the entity they point at.
 */
export const DetailTab = ({ subject, groups, moduleId, onSelect, darkMode }: DetailTabProps) => {
  const renderEntry = (entry: DependencyEntry, group: DetailGroup) => {
    const componentType = entry.kind === 'component' ? group.componentTypeOf?.(entry.id) : undefined;
    const subtitle =
      entry.kind === 'component'
        ? getComponentDisplayName(componentType)
        : entry.kind === 'action'
          ? 'Action'
          : KIND_SUBTITLES[entry.kind];

    // Only event-driven relationships carry a tag line; bindings explain themselves
    // through the hover tooltip instead.
    const tags = entry.details
      .filter((detail) => detail.eventId)
      .map(
        (detail) =>
          `${formatEventLabel(detail.eventId, group.eventSourceTypeOf?.(entry))} → ${formatActionLabel(
            detail.actionId
          )}`
      );

    const bindings = entry.details
      .filter((detail) => detail.expression)
      .map((detail) => ({
        label: formatPropertyLabel(detail.label, group.bindingOwnerTypeOf?.(entry, componentType)),
        expression: detail.expression,
      }));

    const name = entry.kind === 'action' ? formatActionLabel(entry.name) : entry.name;

    return (
      <DependencyEntityRow
        key={`${entry.kind}-${entry.id ?? entry.name}-${group.title}`}
        icon={
          <EntityIcon
            kind={entry.kind}
            entityId={entry.id}
            queriesById={group.queriesById}
            componentsById={group.componentsById}
          />
        }
        name={name}
        subtitle={subtitle}
        tags={tags}
        tooltip={{
          id: `dependency-binding-${group.title}-${entry.kind}-${entry.id ?? entry.name}`,
          title: `${subject.name} ${group.verb} ${name} in`,
          bindings,
        }}
        onClick={
          NAVIGABLE.has(entry.kind) && entry.id
            ? () => onSelect({ kind: entry.kind as DependencySelection['kind'], id: entry.id as string })
            : undefined
        }
        darkMode={darkMode}
        dataCy={`dependency-detail-row-${String(name).toLowerCase()}`}
      />
    );
  };

  return (
    <div className="dependency-detail-body">
      {subject.variableScope && <VariableValue moduleId={moduleId} scope={subject.variableScope} name={subject.name} />}
      {groups.map((group) => (
        <DependencySubSection
          key={group.title}
          title={group.title}
          count={group.showCount === false ? undefined : group.entries.length}
          icon={group.icon}
          indent
        >
          {group.entries.map((entry) => renderEntry(entry, group))}
        </DependencySubSection>
      ))}
    </div>
  );
};

type DetailMenuProps = {
  items?: DetailMenuItem[];
  darkMode?: boolean;
};

const DetailMenu = ({ items, darkMode }: DetailMenuProps) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!items?.length) return null;

  return (
    <div className="dependency-detail-menu-wrapper" ref={ref}>
      <button
        type="button"
        className="dependency-detail-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        data-cy="dependency-detail-menu-button"
        aria-label="Entity actions"
      >
        <span className="dependency-kebab" />
      </button>
      {open && (
        <div className={`dependency-detail-menu ${darkMode ? 'dark-theme' : ''}`}>
          {items.map((item) => (
            <div
              key={item.label}
              className="dependency-detail-menu-item"
              role="button"
              tabIndex={0}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              onKeyDown={activateOnEnterOrSpace(() => {
                setOpen(false);
                item.onClick();
              })}
              data-cy={`dependency-detail-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="dependency-detail-menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const detailMenuIcons: Record<'inspect' | 'goTo', React.ReactNode> = {
  inspect: <SquareDashedMousePointerIcon size={16} className="dependency-lucide-icon" />,
  goTo: <ArrowRightIcon size={16} className="dependency-lucide-icon" />,
};

export const subSectionIcons: Record<'uses' | 'usedBy' | 'events', React.ReactNode> = {
  uses: usesIcon,
  usedBy: usedByIcon,
  events: eventsIcon,
};

export default DetailTab;
