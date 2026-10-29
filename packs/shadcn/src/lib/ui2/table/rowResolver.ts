import { ToolJet } from '@tooljet/custom-component-sdk';

/** A per-row binding evaluated for one row: "{{rowData.status === 'Late' ? '#dc2626' : ''}}", "{{cellValue * 2}}". */
export type RowResolve = (template: unknown, context?: { rowData?: unknown; cellValue?: unknown; rowIndex?: number }) => unknown;

type Sdk = { useRowResolver?: (options?: { props?: string[] }) => RowResolve };

// Hosts without per-row bindings (and the manifest build): a template reads as unset, so it never draws as text or a
// colour; any other value passes through.
const unresolved: RowResolve = (value) => (typeof value === 'string' && value.includes('{{') && value.includes('}}') ? undefined : value);
const useUnresolved = (_options?: { props?: string[] }): RowResolve => unresolved;

/** The host's per-row resolver (ToolJet.useRowResolver), which keeps the row templates of `props` unresolved. */
export const useRowResolver: (options?: { props?: string[] }) => RowResolve = (ToolJet as unknown as Sdk).useRowResolver
  ? (options) => (ToolJet as unknown as Sdk).useRowResolver!(options)
  : useUnresolved;
