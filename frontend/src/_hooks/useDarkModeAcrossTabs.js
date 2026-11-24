import { useEffect } from 'react';

/*
  Dark mode is remembered in localStorage ('darkMode'), and the platform theme is the store's isTJDarkMode, set from it
  once per page load. Toggling it in one tab used to reach other open tabs only halfway: the parts that read
  localStorage on each render (the AI chat) switched on their next render, while the header, canvas and rail kept the
  store's value until reload. A change from another tab now updates the store too, so the whole tab follows.
*/
export const DARK_MODE_KEY = 'darkMode';

/** The new dark mode from another tab's storage event, or null when the event is about something else. */
export const darkModeFromStorageEvent = (event) => {
  if (!event || event.key !== DARK_MODE_KEY || event.newValue === null || event.newValue === event.oldValue) {
    return null;
  }
  return event.newValue === 'true';
};

export default function useDarkModeAcrossTabs(updateIsTJDarkMode) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof updateIsTJDarkMode !== 'function') return undefined;
    // The storage event only fires in the other tabs, never in the one that wrote the value.
    const onStorage = (event) => {
      const darkMode = darkModeFromStorageEvent(event);
      if (darkMode !== null) updateIsTJDarkMode(darkMode);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [updateIsTJDarkMode]);
}
