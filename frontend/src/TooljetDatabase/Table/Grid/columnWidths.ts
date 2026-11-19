import type { ColumnSizingState } from '@tanstack/react-table';

const storageKey = (workspaceId: string, tableId: string) => `tjdb-col-widths:${workspaceId}:${tableId}`;

// Saved state is untrusted: anything that is not an object of positive numbers is ignored.
export function readColumnWidths(workspaceId: string, tableId: string): ColumnSizingState {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(workspaceId, tableId)) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, width]) => typeof width === 'number' && Number.isFinite(width) && width > 0)
    ) as ColumnSizingState;
  } catch {
    return {};
  }
}

// The widths of `columnIds` are replaced by `sizing`; the stored widths of any other column are kept. The table can
// have more columns in another environment, and their widths belong to the table, not to the columns on screen. A
// width for a column that is gone everywhere is never looked up: the grid only reads the columns it has.
export function writeColumnWidths(
  workspaceId: string,
  tableId: string,
  sizing: ColumnSizingState,
  columnIds: string[]
) {
  const others = Object.entries(readColumnWidths(workspaceId, tableId)).filter(([id]) => !columnIds.includes(id));
  const own = Object.entries(sizing).filter(([id]) => columnIds.includes(id));
  const merged = Object.fromEntries([...others, ...own]);
  try {
    if (Object.keys(merged).length === 0) localStorage.removeItem(storageKey(workspaceId, tableId));
    else localStorage.setItem(storageKey(workspaceId, tableId), JSON.stringify(merged));
  } catch {
    // Private mode or a full quota: widths just stop surviving a reload.
  }
}
