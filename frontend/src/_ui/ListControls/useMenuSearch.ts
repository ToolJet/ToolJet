import { useRef, useState } from 'react';

// State shared by the menus that start with a search input.
export function useMenuSearch() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Radix focuses an item on hover and refocuses the menu when the pointer leaves it. Cancelling that while the
  // input has focus keeps the user typing.
  const keepInputFocus = (event: { preventDefault: () => void }) => {
    if (document.activeElement === inputRef.current) event.preventDefault();
  };

  return { query, setQuery, inputRef, needle: query.trim().toLowerCase(), keepInputFocus };
}

export type MenuSearch = ReturnType<typeof useMenuSearch>;
