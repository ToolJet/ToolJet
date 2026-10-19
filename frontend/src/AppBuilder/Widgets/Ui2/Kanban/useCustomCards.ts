import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { takeRowValues } from '@/AppBuilder/Widgets/Ui2/_shared/rowValues';
import { boardCards } from './kanbanBoard';
import type { BoardColumn } from './kanbanBoard';

// Not a card key (keys are record ids or made from a column and a position).
const NO_RECORD = '\u0000';

/** What custom cards read from the app store. */
type CustomCardStore = {
  updateCustomResolvables: (
    id: string,
    values: Record<string, unknown>[],
    key: string,
    moduleId: string,
    parentIndices: number[]
  ) => void;
  initExposedValueArrayForChildren: (id: string, count: number, moduleId: string, parentIndices: number[]) => void;
};

/**
 * Custom card content: every card renders the board's one card canvas (the components dropped on the first card) with
 * its own row of cardData, as a List view renders its rows. Each card is a row of the board, under the outer rows the
 * board sits in (`parentIndices`, as a nested List view's rows are): its components keep their values per card
 * (components[child][...outer][card], by board order), so a card's button acts on its own card's components. Those
 * values move with their cards when cards move (takeRowValues).
 *
 * Cards are drawn from the board as last published (`board`), so a card that moves never resolves another card's
 * {{cardData}} for a render (with a default bound to the card, that reset an edited Input). `order` is each card's row.
 *
 * A card key names a record only under the board's id field (`identity`): under another one the same key can be
 * another record (Alpha's id is Beta's code), so what was typed on Alpha moved to Beta and Alpha's actions changed
 * Beta. A new id field starts the cards over: no row's values move, and `generation` changes so the board mounts
 * every card's components again (their old actions go with them).
 */
export const useCustomCards = (
  id: string,
  custom: boolean,
  parentIndices: number[],
  columns: BoardColumn[],
  identity: string
) => {
  const { moduleId } = useModuleContext();
  const updateCustomResolvables = useStore((state: CustomCardStore) => state.updateCustomResolvables);
  const initExposedValueArrayForChildren = useStore((state: CustomCardStore) => state.initExposedValueArrayForChildren);
  const [published, setPublished] = useState({ columns, generation: 0 });
  const publishedKeys = useRef<string[]>([]);
  // Read when the cards publish, not a reason to: the board's cards follow a new id field a render after it.
  const identityNow = useRef(identity);
  identityNow.current = identity;
  const publishedIdentity = useRef(identity);
  const generation = useRef(0);
  useLayoutEffect(() => {
    if (!custom) return;
    if (publishedIdentity.current !== identityNow.current) {
      publishedIdentity.current = identityNow.current;
      generation.current += 1;
      // No row was any record before: each row's values clear (takeRowValues), none move.
      publishedKeys.current = publishedKeys.current.map(() => NO_RECORD);
    }
    // Published only once there are cards, the native Listview's way: publishing an empty board (data still loading)
    // shrank every card component's per-card entries to none, and the cards built later lacked the component's own
    // settings (show on desktop), so custom card content rendered blank.
    const cards = boardCards(columns);
    if (cards.length) {
      const keys = columns.flatMap((column) => column.cards.map((card) => card.__key));
      const moveValues = takeRowValues(id, moduleId, parentIndices, publishedKeys.current, keys);
      updateCustomResolvables(
        id,
        cards.map((card) => ({ cardData: card })),
        'cardData',
        moduleId,
        parentIndices
      );
      initExposedValueArrayForChildren(id, cards.length, moduleId, parentIndices);
      moveValues?.();
      publishedKeys.current = keys;
    }
    setPublished({ columns, generation: generation.current });
  }, [custom, parentIndices, columns, id, moduleId, updateCustomResolvables, initExposedValueArrayForChildren]);
  const board = custom ? published.columns : columns;
  const order = useMemo(
    () => new Map(board.flatMap((column) => column.cards).map((card, index) => [card.__key, index])),
    [board]
  );
  return { board, order, generation: published.generation };
};
