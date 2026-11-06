import { act, renderHook } from '@testing-library/react';
import useDarkModeAcrossTabs, { darkModeFromStorageEvent } from '../useDarkModeAcrossTabs';

// Dark mode toggled in another tab updates this tab's platform theme too, not only the parts that re-read storage.
const storageEvent = (key, newValue, oldValue) => {
  const event = new Event('storage');
  Object.assign(event, { key, newValue, oldValue });
  return event;
};

test('another tab turning dark mode on or off updates this tab', () => {
  const updateIsTJDarkMode = jest.fn();
  renderHook(() => useDarkModeAcrossTabs(updateIsTJDarkMode));
  act(() => window.dispatchEvent(storageEvent('darkMode', 'true', 'false')));
  expect(updateIsTJDarkMode).toHaveBeenLastCalledWith(true);
  act(() => window.dispatchEvent(storageEvent('darkMode', 'false', 'true')));
  expect(updateIsTJDarkMode).toHaveBeenLastCalledWith(false);
});

test('other keys, cleared storage and unchanged values are ignored', () => {
  const updateIsTJDarkMode = jest.fn();
  renderHook(() => useDarkModeAcrossTabs(updateIsTJDarkMode));
  act(() => {
    window.dispatchEvent(storageEvent('queryManagerPreferences', '{}', null));
    window.dispatchEvent(storageEvent(null, null, null)); // localStorage.clear() in another tab
    window.dispatchEvent(storageEvent('darkMode', 'true', 'true'));
  });
  expect(updateIsTJDarkMode).not.toHaveBeenCalled();
});

test('stops listening on unmount', () => {
  const updateIsTJDarkMode = jest.fn();
  const { unmount } = renderHook(() => useDarkModeAcrossTabs(updateIsTJDarkMode));
  unmount();
  act(() => window.dispatchEvent(storageEvent('darkMode', 'true', 'false')));
  expect(updateIsTJDarkMode).not.toHaveBeenCalled();
});

test('darkModeFromStorageEvent', () => {
  expect(darkModeFromStorageEvent({ key: 'darkMode', newValue: 'true', oldValue: null })).toBe(true);
  expect(darkModeFromStorageEvent({ key: 'darkMode', newValue: null, oldValue: 'true' })).toBeNull();
  expect(darkModeFromStorageEvent(undefined)).toBeNull();
});
