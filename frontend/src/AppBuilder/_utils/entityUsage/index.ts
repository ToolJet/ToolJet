/**
 * Read-only usage selectors for the Dependency Viewer.
 *
 * Answers "what does this entity use / who uses it" for components and queries by
 * combining two sources:
 *  - the runtime dependency graph (component property bindings are always registered there)
 *  - on-demand extraction of {{}} refs from query options (query→entity edges only exist
 *    in the graph when runOnDependencyChange is enabled, so they are computed here instead)
 *
 * Never writes to the dependency graph or the resolved store.
 */

export type { UsageEntryKind, UsageDetail, UsageEntry, EventTarget } from './types';
export type { ComponentUsageById, VariableUsage } from './variableUsage';
export type { DeleteTargets, DeleteSubject } from './deleteBlockers';
export type { QuerySection, ComponentSection, DependencySections } from './sections';
export type { RunsOnLoadSections } from './queryUsage';

export { getComponentUsage } from './componentUsage';
export { getQueryUsage, getQueryOwnEvents, getPageLoadQueries } from './queryUsage';
export { getVariableUsage } from './variableUsage';
export { getDeleteBlockers } from './deleteBlockers';
export { getDependencySections } from './sections';
export { detailOf, prettyExpression } from './internals';
