import type React from 'react';

/**
 * Props that make an item picked from the keyboard as from the pointer: a Tab stop that Enter and Space pick, as a
 * click does. Spread onto the item's element (an Ant Card passes them to its root).
 */
export const keyboardPick = (pick: () => void) => ({
  tabIndex: 0,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    pick();
  },
});
