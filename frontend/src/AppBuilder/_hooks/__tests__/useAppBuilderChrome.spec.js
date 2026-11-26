import { renderHook } from '@testing-library/react';
import useAppBuilderChrome from '../useAppBuilderChrome';

// Portals render under <body>, outside the editor wrapper, so the editor font must live on <body>
// and leave with the editor, or the dashboard inherits it (UB-01, UA-08).
const bodyFont = () => document.body.style.getPropertyValue('--app-builder-font-family');
const bodySmallSize = () => document.body.style.getPropertyValue('--app-builder-small-font-size');

describe('useAppBuilderChrome', () => {
  afterEach(() => {
    document.body.removeAttribute('style');
    document.body.removeAttribute('class');
  });

  it('sets the editor font on <body> while the editor is mounted and removes it on unmount', () => {
    const { unmount } = renderHook(() => useAppBuilderChrome(true));
    expect(bodyFont()).toBe("'IBM Plex Sans', sans-serif");
    expect(bodySmallSize()).toBe('12px');
    expect(document.body).toHaveClass('app-builder-chrome');

    unmount();
    expect(bodyFont()).toBe('');
    expect(bodySmallSize()).toBe('');
    expect(document.body).not.toHaveClass('app-builder-chrome');
  });

  it('leaves <body> alone outside edit mode and clears it when the editor leaves edit mode', () => {
    const { rerender } = renderHook(({ editing }) => useAppBuilderChrome(editing), {
      initialProps: { editing: false },
    });
    expect(bodyFont()).toBe('');

    rerender({ editing: true });
    expect(bodyFont()).toBe("'IBM Plex Sans', sans-serif");

    rerender({ editing: false });
    expect(bodyFont()).toBe('');
  });

  it('keeps inline styles on <body> that the editor did not set', () => {
    document.body.style.setProperty('overflow', 'hidden');
    const { unmount } = renderHook(() => useAppBuilderChrome(true));
    unmount();
    expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');
  });
});

describe('useAppBuilderChrome dark mode', () => {
  afterEach(() => document.body.removeAttribute('class'));

  it('marks <body> dark only while the editor is dark, and clears it on unmount', () => {
    const { rerender, unmount } = renderHook(({ dark }) => useAppBuilderChrome(true, dark), {
      initialProps: { dark: false },
    });
    expect(document.body).not.toHaveClass('app-builder-chrome--dark');

    rerender({ dark: true });
    expect(document.body).toHaveClass('app-builder-chrome--dark');

    unmount();
    expect(document.body).not.toHaveClass('app-builder-chrome--dark');
  });
});
