import { useEffect, useRef, useState } from 'react';

type Row = Record<string, unknown>;

/** A drawn record: its key (the id, a repeated one suffixed by occurrence), its data row and its data position. */
export interface SelectableRecord {
  key: string;
  row: Row;
  index: number;
}

interface Publishers {
  setItem: (row: Row) => void;
  setId: (id: unknown) => void;
  setIndex: (index: number) => void;
}

interface Published {
  row: Row;
  id: unknown;
  index: number;
}

const sameJson = (a: unknown, b: unknown) => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

const idText = (v: unknown): string => (v === undefined || v === null || v === '' ? '' : String(v));

const contentOf = (v: unknown): string => {
  try {
    return JSON.stringify(v) ?? '';
  } catch {
    return '';
  }
};

/** The content of each row holding `id` (as text), in order: what followSelection compares a selection against. */
export const idGroup = (rows: unknown[], ids: string[], id: string): string[] =>
  id === '' ? [] : ids.flatMap((v, i) => (v === id ? [contentOf(rows[i])] : []));

/**
 * The row a list's selection follows when its data changes. The same rule in the Ant List, the MUI List and the
 * shadcn lists (keep the copies the same).
 *
 * An id only one row holds is followed as before: a refresh exposes the record as it is now, edited or not, a reorder
 * keeps it, and a removal clears it. A repeated id is keyed by its occurrence (its first row, its second, ...), and an
 * occurrence is not a record: after a reorder the second row of an id is another record, and the selection moved to it
 * with no user action (Codex review, 2026-10-27). So while the selected id is shared (in the new data, or when it was
 * picked or last followed), the selection stays on the same record or clears:
 * - the row its key names, when that row's content is the selected record's (a refresh that changed nothing);
 * - else the one row of that id with the record's content (a reorder); more than one such row (copies) clears;
 * - else, the record was edited: the row its key names, only when the id's rows kept their places (as many rows, and
 *   none of them now holds the content another of them had); otherwise the rows moved and the selection clears.
 * Clearing exposes nothing selected and fires no event, as for a removed record.
 *
 * `ids` is each row's id as text ('' for none), `at` the row the selection's key names now (-1 for none), `id` and
 * `record` the selected record's id text and its record as last exposed, `before` the id's group (idGroup) when the
 * selection was picked or last followed. Returns the row to follow (-1 clears) and the id's group now, the next
 * `before`.
 */
export const followSelection = (p: {
  rows: unknown[];
  ids: string[];
  at: number;
  id: string;
  record: unknown;
  before: string[];
}): { index: number; group: string[] } => {
  const holders = p.id === '' ? [] : p.ids.flatMap((v, i) => (v === p.id ? [i] : []));
  const group = holders.map((i) => contentOf(p.rows[i]));
  if (group.length < 2 && p.before.length < 2) return { index: p.at, group };
  const record = contentOf(p.record);
  if (p.at >= 0 && contentOf(p.rows[p.at]) === record) return { index: p.at, group };
  const matches = holders.filter((_, n) => group[n] === record);
  if (matches.length) return { index: matches.length === 1 ? matches[0] : -1, group };
  const inPlace = group.length === p.before.length && group.every((g, n) => p.before.every((b, m) => m === n || b !== g));
  return { index: p.at >= 0 && inPlace ? p.at : -1, group };
};

// The selected record of CardGrid, RecordList and ProgressList, followed by its key as the bound data changes. They
// published selectedItem / selectedItemId / selectedItemIndex only on a click, so a refresh, a reorder or a removal
// left a detail panel reading old or removed data while the rows on screen were current (pack audit SP-31,
// 2026-10-23). Now the exposed record is the current row of the selected key, at its current index, and a removed one
// clears it; none of this fires the click event. The id is the id field's own value, so a number stays a number
// (SP-32): a strict id === selectedItemId lookup has to work. A record whose id other records share is followed by
// followSelection's rule: kept only while it is the same record by content, else cleared.
export const useRecordSelection = (
  records: SelectableRecord[],
  idOf: (row: Row) => unknown,
  publish: Publishers,
  onPicked: () => void
) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const published = useRef<Published | null>(null);
  // The selected id's records (their content) when picked or last followed (followSelection).
  const group = useRef<string[]>([]);
  const idsOf = (list: SelectableRecord[]) => list.map((r) => idText(idOf(r.row)));
  const write = (next: Published | null) => {
    published.current = next;
    publish.setItem(next ? next.row : {});
    publish.setId(next ? next.id : null);
    publish.setIndex(next ? next.index : -1);
  };

  // Published before the event, so its handler reads the record just picked. An action's pick (fire false) publishes
  // the same way without the click event.
  const pick = (record: SelectableRecord, fire = true) => {
    setSelectedKey(record.key);
    group.current = idGroup(records.map((r) => r.row), idsOf(records), idText(idOf(record.row)));
    write({ row: record.row, id: idOf(record.row) ?? null, index: record.index });
    if (fire) onPicked();
  };
  const clear = () => {
    setSelectedKey(null);
    if (published.current) write(null);
  };

  useEffect(() => {
    if (selectedKey === null) return;
    const last = published.current;
    const followed = followSelection({
      rows: records.map((r) => r.row),
      ids: idsOf(records),
      at: records.findIndex((r) => r.key === selectedKey),
      id: last ? idText(last.id) : '',
      record: last?.row,
      before: group.current,
    });
    group.current = followed.index >= 0 ? followed.group : [];
    const record = records[followed.index];
    // Gone from the data (or no longer surely the same record): cleared, not resurrected if a record with that id comes
    // back later.
    if (!record) {
      setSelectedKey(null);
      write(null);
      return;
    }
    if (record.key !== selectedKey) setSelectedKey(record.key);
    const next = { row: record.row, id: idOf(record.row) ?? null, index: record.index };
    // A re-render with equal data rewrites nothing.
    if (last && last.index === next.index && last.id === next.id && sameJson(last.row, next.row)) return;
    write(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  return { selectedKey, pick, clear };
};
