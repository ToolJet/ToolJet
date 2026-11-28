import {
  CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY,
  getDefaultCodehinterPopupEditorDimensions,
  readCodehinterPopupEditorDimensions,
} from '../codehinterPortalDimensions';

describe('readCodehinterPopupEditorDimensions', () => {
  beforeEach(() => localStorage.clear());

  test('should return the saved rect when it is on screen', () => {
    const saved = { width: 640, height: 400, x: 120, y: 80 };
    localStorage.setItem(CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY, JSON.stringify(saved));

    expect(readCodehinterPopupEditorDimensions()).toEqual(saved);
  });

  test('should ignore a rect saved by the old centre-anchored popup, so the popup opens centred and not in the top-left corner', () => {
    localStorage.setItem(
      CODEHINTER_POPUP_EDITOR_DIMENSIONS_KEY,
      JSON.stringify({ width: 500, height: 350, x: -278, y: 77 })
    );

    expect(readCodehinterPopupEditorDimensions()).toBeNull();
    expect(getDefaultCodehinterPopupEditorDimensions().x).toBeGreaterThan(0);
  });
});
