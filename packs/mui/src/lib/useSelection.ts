import { useEffect, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { rowIdOf, str, type Row } from './data';

export type Selectable = { key: string; row: Row; index: number };

// The selection of a record collection (the CardGrid), as the Ant pack's RecordList, CardGrid and ProgressList keep it:
// it follows its record by key across a refresh or a reorder (the record and its index exposed as they are now) and
// clears once the record is gone. selectedItemId keeps the id's own type (1, not '1').
export const useSelection = (items: Selectable[], idField: unknown) => {
  const [, setSelectedItemId] = ToolJet.useStateString({ name: 'selectedItemId', initialValue: '', inspector: 'hidden' });
  const [selectedItem, setSelectedItem] = ToolJet.useStateObject({ name: 'selectedItem', initialValue: {}, inspector: 'hidden' });
  const [selectedItemIndex, setSelectedItemIndex] = ToolJet.useStateNumber({ name: 'selectedItemIndex', initialValue: -1, inspector: 'hidden' });
  const [selectedKey, setSelectedKey] = useState('');
  const idOf = (it: Selectable) => {
    const row = it.row && typeof it.row === 'object' ? it.row : {};
    const id = rowIdOf(row as Row, str(idField) || 'id', -1);
    return id === -1 ? it.key : id;
  };
  const select = (it: Selectable | null) => {
    setSelectedKey(it ? it.key : '');
    setSelectedItemId((it ? idOf(it) : '') as string);
    setSelectedItem(it ? it.row : {});
    setSelectedItemIndex(it ? it.index : -1);
  };
  const rowsKey = JSON.stringify(items.map((it) => [it.key, it.index, it.row]));
  useEffect(() => {
    if (!selectedKey) return;
    const hit = items.find((it) => it.key === selectedKey);
    if (!hit) select(null);
    else if (hit.index !== selectedItemIndex || JSON.stringify(hit.row) !== JSON.stringify(selectedItem)) select(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsKey]);
  return { selectedItemId: selectedKey, select };
};
