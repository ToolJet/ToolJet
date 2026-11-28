import { authenticationService } from '@/_services';

/*
  What a user chose for each pop-out panel, kept in this browser: whether the panel was last in its own window (so it
  opens there again), and where that window was. Per user, because a shared computer has several; in localStorage,
  because a window's place belongs to the screen it was on, not to the account.
*/

const storageKey = () => {
  const userId = authenticationService.currentSessionValue?.current_user?.id ?? 'anonymous';
  return `tj:popout-panels:${userId}`;
};

const readAll = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey()) ?? '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
};

/** `{ poppedOut, bounds }` for the panel; `poppedOut` is false and `bounds` undefined until the user has used it. */
export const readPanelPreference = (panelId) => {
  const stored = readAll()[panelId];
  return {
    poppedOut: stored?.poppedOut === true,
    bounds: stored?.bounds && typeof stored.bounds === 'object' ? stored.bounds : undefined,
  };
};

/** Merges `change` (`poppedOut`, `bounds`) into what is kept for the panel. */
export const writePanelPreference = (panelId, change) => {
  try {
    const all = readAll();
    all[panelId] = { ...all[panelId], ...change };
    localStorage.setItem(storageKey(), JSON.stringify(all));
  } catch {
    /* storage off or full: the choice lasts for this visit */
  }
};
