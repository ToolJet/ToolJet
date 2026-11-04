import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getIdFromRowId, getLoadedItems, type LoadedItemSummary } from '../items';

interface BulkActionResponse {
  blocked_ids: string[];
}

type SendBulkAction = (ids: string[], options: { onSuccess: (response: BulkActionResponse) => void }) => void;

interface BulkActionFlow {
  /** Items the last call blocked; empty until a call comes back blocked. */
  blockedItems: LoadedItemSummary[];
  /** How many ids the last call sent, the "of N" in "3 of 5 can't be deleted". */
  attemptedCount: number;
  /** How many ids the next submit sends. */
  remainingCount: number;
  submit: () => void;
}

// The bulk calls (delete, move, remove) are all or nothing: if anything is blocked, nothing happens.
// The first submit sends every id; after a blocked response, the next one resends the rest.
// `selectedRowIds` may shrink while the dialog is open (a row dropped from the list).
export function useBulkActionFlow(
  selectedRowIds: string[],
  send: SendBulkAction,
  onDone: (doneCount: number) => void
): BulkActionFlow {
  const queryClient = useQueryClient();
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [sentCount, setSentCount] = useState(0);

  const remainingIds = selectedRowIds.map(getIdFromRowId).filter((id) => !excludedIds.includes(id));

  const submit = () => {
    send(remainingIds, {
      onSuccess: ({ blocked_ids: blocked = [] }) => {
        if (blocked.length) {
          setSentCount(remainingIds.length);
          setBlockedIds(blocked);
          setExcludedIds((excluded) => [...excluded, ...blocked]);
        } else {
          onDone(remainingIds.length);
        }
      },
    });
  };

  return {
    blockedItems: blockedIds.length ? getLoadedItems(queryClient, blockedIds) : [],
    attemptedCount: sentCount,
    remainingCount: remainingIds.length,
    submit,
  };
}
