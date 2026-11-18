export type CellFocus = { rowIndex: number; columnId: string; editing: boolean };
export type CellNavState = CellFocus | null;

/** The grid's bounds. `columnIds` are the navigable columns in visual order: the select column is not one. */
type Bounds = { rowCount: number; columnIds: readonly string[] };

export type CellNavAction =
  | { type: 'focus'; rowIndex: number; columnId: string }
  | ({ type: 'move'; direction: 'up' | 'down' | 'left' | 'right' } & Bounds)
  | ({ type: 'tab'; backwards: boolean } & Bounds)
  | { type: 'startEditing' }
  /** Closes the editor and keeps the cell focused. */
  | { type: 'stopEditing' }
  /** Esc on the grid: closes the editor when one is open, otherwise clears the focus. */
  | { type: 'escape' };

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

const moveBy = (state: CellNavState, rowDelta: number, columnDelta: number, { rowCount, columnIds }: Bounds) => {
  if (rowCount === 0 || columnIds.length === 0) return null;
  if (!state) return { rowIndex: 0, columnId: columnIds[0], editing: false };
  // The editor owns the keys while it is open.
  if (state.editing) return state;

  const rowIndex = clamp(state.rowIndex + rowDelta, rowCount - 1);
  const columnId = columnIds[clamp(columnIds.indexOf(state.columnId) + columnDelta, columnIds.length - 1)];
  // Same object at an edge: the caller tells "did not move" from `===`.
  return rowIndex === state.rowIndex && columnId === state.columnId ? state : { rowIndex, columnId, editing: false };
};

// The focused cell and whether its editor is open. A move that goes nowhere returns the state it was given.
export const cellNavigationReducer = (state: CellNavState, action: CellNavAction): CellNavState => {
  switch (action.type) {
    case 'focus':
      // Clicking inside the open editor reaches here too and must not close it.
      if (state?.rowIndex === action.rowIndex && state.columnId === action.columnId) return state;
      return { rowIndex: action.rowIndex, columnId: action.columnId, editing: false };
    case 'move': {
      const { direction } = action;
      const rowDelta = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      const columnDelta = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      return moveBy(state, rowDelta, columnDelta, action);
    }
    case 'tab':
      return moveBy(state, 0, action.backwards ? -1 : 1, action);
    case 'startEditing':
      return state && !state.editing ? { ...state, editing: true } : state;
    case 'stopEditing':
      return state?.editing ? { ...state, editing: false } : state;
    case 'escape':
      return state?.editing ? { ...state, editing: false } : null;
  }
};

/** The DOM id of a body cell, for `aria-activedescendant`. Column position, not name: names can hold spaces. */
export const cellDomId = (rowIndex: number, visibleColumnIndex: number) =>
  `tjdb-cell-${rowIndex}-${visibleColumnIndex}`;

type Reveal = {
  cellStart: number;
  cellWidth: number;
  scrollLeft: number;
  viewportWidth: number;
  /** Pinned columns cover the left edge of the viewport. */
  pinnedWidth: number;
  /** The sticky add column cell covers the right edge. */
  trailingWidth: number;
};

/** The `scrollLeft` that brings a scrolling cell fully into view, or null when it already is. */
export const scrollLeftToReveal = ({
  cellStart,
  cellWidth,
  scrollLeft,
  viewportWidth,
  pinnedWidth,
  trailingWidth,
}: Reveal): number | null => {
  if (cellStart < scrollLeft + pinnedWidth) return cellStart - pinnedWidth;
  const overshoot = cellStart + cellWidth - (scrollLeft + viewportWidth - trailingWidth);
  return overshoot > 0 ? scrollLeft + overshoot : null;
};
