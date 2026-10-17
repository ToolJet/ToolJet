import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { takeRowValues } from '@/AppBuilder/Widgets/Ui2/_shared/rowValues';
import { boardCards } from './kanbanBoard';
import type { BoardColumn } from './kanbanBoard';

/** What custom cards read from the app store. */
type CustomCardStore = {
  updateCustomResolvables: (id: string, values: Record<string, unknown>[], key: string, moduleId: string) => void;
  initExposedValueArrayForChildren: (id: string, count: number, moduleId: string, parentIndices: number[]) => void;
};

/**
 * Custom card content: every card renders the board's one card canvas (the components dropped on the first card) with
 * its own row of cardData, as a List view renders its rows. On a top-level board (`scoped`) each card is a row of the
 * board: its components keep their values per card (components[child][card], by board order), so a card's button
 * acts on its own card's components. Those values move with their cards when cards move (takeRowValues). Inside
 * another row-scoped widget the card canvas has no context of its own yet, and its components keep one entry.
 *
 * Cards are drawn from the board as last published (`board`), so a card that moves never resolves another card's
 * {{cardData}} for a render (with a default bound to the card, that reset an edited Input). `order` is each card's row.
 */
export const useCustomCards = (id: string, custom: boolean, scoped: boolean, columns: BoardColumn[]) => {
  const { moduleId } = useModuleContext();
  const updateCustomResolvables = useStore((state: CustomCardStore) => state.updateCustomResolvables);
  const initExposedValueArrayForChildren = useStore((state: CustomCardStore) => state.initExposedValueArrayForChildren);
  const [published, setPublished] = useState(columns);
  const publishedKeys = useRef<string[]>([]);
  useLayoutEffect(() => {
    if (!custom) return;
    // Published only once there are cards, the native Listview's way: publishing an empty board (data still loading)
    // shrank every card component's per-card entries to none, and the cards built later lacked the component's own
    // settings (show on desktop), so custom card content rendered blank.
    const cards = boardCards(columns);
    if (cards.length) {
      const keys = columns.flatMap((column) => column.cards.map((card) => card.__key));
      const moveValues = scoped ? takeRowValues(id, moduleId, [], publishedKeys.current, keys) : null;
      updateCustomResolvables(
        id,
        cards.map((card) => ({ cardData: card })),
        'cardData',
        moduleId
      );
      if (scoped) initExposedValueArrayForChildren(id, cards.length, moduleId, []);
      moveValues?.();
      publishedKeys.current = keys;
    }
    setPublished(columns);
  }, [custom, scoped, columns, id, moduleId, updateCustomResolvables, initExposedValueArrayForChildren]);
  const board = custom ? published : columns;
  const order = useMemo(
    () => new Map(board.flatMap((column) => column.cards).map((card, index) => [card.__key, index])),
    [board]
  );
  return { board, order };
};
