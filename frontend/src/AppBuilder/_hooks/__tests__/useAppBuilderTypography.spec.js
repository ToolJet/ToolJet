import { renderHook } from '@testing-library/react';
import useAppBuilderTypography from '../useAppBuilderTypography';

// Portals render under <body>, outside the editor wrapper, so the editor font must live on <body>
// and leave with the editor, or the dashboard inherits it (UB-01, UA-08).
const bodyFont = () => document.body.style.getPropertyValue('--app-builder-font-family');
const bodySmallSize = () => document.body.style.getPropertyValue('--app-builder-small-font-size');

describe('useAppBuilderTypography', () => {
  afterEach(() => document.body.removeAttribute('style'));

  it('sets the editor font on <body> while the editor is mounted and removes it on unmount', () => {
    const { unmount } = renderHook(() => useAppBuilderTypography(true));
    expect(bodyFont()).toBe("'IBM Plex Sans', sans-serif");
    expect(bodySmallSize()).toBe('12px');

    unmount();
    expect(bodyFont()).toBe('');
    expect(bodySmallSize()).toBe('');
  });

  it('leaves <body> alone outside edit mode and clears it when the editor leaves edit mode', () => {
    const { rerender } = renderHook(({ editing }) => useAppBuilderTypography(editing), {
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
    const { unmount } = renderHook(() => useAppBuilderTypography(true));
    unmount();
    expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');
  });
});
