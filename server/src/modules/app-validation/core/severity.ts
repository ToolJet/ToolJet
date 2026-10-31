import { Severity, WriteSource } from '../types';

// Sources that reproduce already-stored data (an export, a git pull, a version copy or
// restore): defects there are pre-existing facts to report, not reasons to reject the
// whole operation.
export const BULK_SOURCES: ReadonlySet<WriteSource> = new Set(['import', 'git', 'copy', 'restore']);

// Severity for rules that judge reproduced stored data (names, dangling references):
// high for interactive writes, medium for bulk sources so one legacy name or orphaned
// reference cannot block a whole import once a bulk source moves to enforce.
export function referenceSeverity(source: WriteSource): Severity {
  return BULK_SOURCES.has(source) ? 'medium' : 'high';
}

// A field was changed by this write. Creates check everything the write carries.
export function touchedField(write: { op: string; touched?: string[] }, field: string): boolean {
  if (write.op !== 'update' || !write.touched) return true;
  return write.touched.includes(field);
}
