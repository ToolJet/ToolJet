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

// The selected record of CardGrid, RecordList and ProgressList, followed by its key as the bound data changes. They
// published selectedItem / selectedItemId / selectedItemIndex only on a click, so a refresh, a reorder or a removal
// left a detail panel reading old or removed data while the rows on screen were current (pack audit SP-31,
// 2026-10-23). Now the exposed record is the current row of the selected key, at its current index, and a removed one
// clears it; none of this fires the click event. The id is the id field's own value, so a number stays a number
// (SP-32): a strict id === selectedItemId lookup has to work.
export const useRecordSelection = (
  records: SelectableRecord[],
  idOf: (row: Row) => unknown,
  publish: Publishers,
  onPicked: () => void
) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const published = useRef<Published | null>(null);
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
    write({ row: record.row, id: idOf(record.row) ?? null, index: record.index });
    if (fire) onPicked();
  };
  const clear = () => {
    setSelectedKey(null);
    if (published.current) write(null);
  };

  useEffect(() => {
    if (selectedKey === null) return;
    const record = records.find((r) => r.key === selectedKey);
    // Gone from the data: cleared, not resurrected if a record with that id comes back later.
    if (!record) {
      setSelectedKey(null);
      write(null);
      return;
    }
    const next = { row: record.row, id: idOf(record.row) ?? null, index: record.index };
    const last = published.current;
    // A re-render with equal data rewrites nothing.
    if (last && last.index === next.index && last.id === next.id && sameJson(last.row, next.row)) return;
    write(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  return { selectedKey, pick, clear };
};
