/**
 * Presentation-layer shapes for the Dependencies panel.
 *
 * The domain types live in `@/AppBuilder/_utils/entityUsage`, which is deliberately
 * free of React. Anything that carries a rendered icon or crosses a component
 * boundary belongs here instead.
 */
import type { ReactNode } from 'react';
import type { UsageEntry, UsageEntryKind } from '@/AppBuilder/_utils/entityUsage';

/** Untyped-JS seams: raw store slices keyed by entity id. */
export type QueriesById = Record<string, any>;
export type ComponentsById = Record<string, any>;

/**
 * `UsageEntryKind` plus the two synthetic kinds DependencyViewer invents for the
 * "Triggered by" rows of an app-load / page-load query. entityUsage never emits them,
 * so the domain union stays closed and only the presentation boundary widens.
 */
export type DependencyEntryKind = UsageEntryKind | 'appLoad' | 'pageLoad';

export type DependencyEntry = Omit<UsageEntry, 'kind'> & { kind: DependencyEntryKind };

export type DependencySelectionKind = 'query' | 'component' | 'variable';

/** What the main tab hands back when a row is clicked. Variables use `scope:name` as the id. */
export type DependencySelection = {
  kind: DependencySelectionKind;
  id: string;
};

export type TooltipBinding = {
  label: string;
  expression?: string;
};

export type RowTooltip = {
  id: string;
  title: string;
  bindings: TooltipBinding[];
};

export type DetailSubject = {
  kind: DependencyEntryKind;
  name: string;
  icon: ReactNode;
  /** Set only for variables — drives the live "Current value" row. */
  variableScope?: 'app' | 'page';
};

export type DetailMenuItem = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

/**
 * One relationship group, built by DependencyViewer and rendered by DetailTab.
 * The three `…Of` callbacks close over the live store maps; they are optional
 * because DetailTab must tolerate a group built without them.
 */
export type DetailGroup = {
  title: string;
  icon: ReactNode;
  verb: string;
  entries: DependencyEntry[];
  queriesById?: QueriesById;
  componentsById?: ComponentsById;
  componentTypeOf?: (id: string | null) => string | undefined;
  eventSourceTypeOf?: (entry: DependencyEntry) => string | undefined;
  bindingOwnerTypeOf?: (entry: DependencyEntry, entryComponentType?: string) => string | undefined;
  /** false hides the "(n)" in the subsection header — used for "Events". */
  showCount?: boolean;
  eventSourceIsSubject?: boolean;
  bindingOwnerIsSubject?: boolean;
  subjectComponentType?: string;
};

export type DetailView = {
  breadcrumbRoot: string;
  subject: DetailSubject;
  groups: DetailGroup[];
  menuItems: DetailMenuItem[];
};
