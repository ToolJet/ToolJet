import { calculateInputCanvasHeight, resolveInputCanvasAlignment } from '../componentsSliceUtils';

describe('resolveInputCanvasAlignment', () => {
  const dynamicAlignment = `{{components.3e6160a5-9042-42fc-ac11-aa3b71c67bf6.value ? 'top' : 'side'}}`;

  it('uses the resolved-value pipeline for dynamic alignment in the new layout', () => {
    const resolveValue = jest.fn(() => 'top');

    expect(
      resolveInputCanvasAlignment({
        alignment: dynamicAlignment,
        hasLegacyLayoutProperty: true,
        legacyLayout: false,
        resolveValue,
      })
    ).toEqual({ alignment: 'top', isDynamicAlignment: true });
    expect(resolveValue).toHaveBeenCalledWith(dynamicAlignment);
  });

  it('keeps dynamic alignment unresolved in the legacy layout', () => {
    const resolveValue = jest.fn(() => 'top');

    expect(
      resolveInputCanvasAlignment({
        alignment: dynamicAlignment,
        hasLegacyLayoutProperty: true,
        legacyLayout: true,
        resolveValue,
      })
    ).toEqual({ alignment: dynamicAlignment, isDynamicAlignment: true });
    expect(resolveValue).not.toHaveBeenCalled();
  });

  it('resolves dynamic alignment for widgets without the legacy layout property', () => {
    const resolveValue = jest.fn(() => 'top');

    expect(
      resolveInputCanvasAlignment({
        alignment: dynamicAlignment,
        hasLegacyLayoutProperty: false,
        resolveValue,
      })
    ).toEqual({ alignment: 'top', isDynamicAlignment: true });
    expect(resolveValue).toHaveBeenCalledWith(dynamicAlignment);
  });
});

describe('calculateInputCanvasHeight', () => {
  it('does not add top-label height when an input label is empty and legacy layout is disabled', () => {
    expect(
      calculateInputCanvasHeight({
        height: 40,
        alignment: 'top',
        auto: true,
        width: 0,
        labelLength: 0,
        legacyLayout: false,
      })
    ).toBe(40);
  });

  it('adds top-label height when an input label is empty and legacy layout is enabled', () => {
    expect(
      calculateInputCanvasHeight({
        height: 40,
        alignment: 'top',
        auto: true,
        width: 0,
        labelLength: 0,
        legacyLayout: true,
      })
    ).toBe(60);
  });

  it('adds top-label height when fx resolves alignment to top and legacy layout is disabled', () => {
    expect(
      calculateInputCanvasHeight({
        height: 40,
        alignment: 'top',
        auto: true,
        width: 0,
        labelLength: 4,
        legacyLayout: false,
        isDynamicAlignment: true,
      })
    ).toBe(60);
  });

  it('preserves height when fx resolves alignment to top and legacy layout is enabled', () => {
    expect(
      calculateInputCanvasHeight({
        height: 40,
        alignment: 'top',
        auto: true,
        width: 0,
        labelLength: 4,
        legacyLayout: true,
        isDynamicAlignment: true,
      })
    ).toBe(40);
  });

  it('keeps the top-label height for inputs with a label', () => {
    expect(
      calculateInputCanvasHeight({
        height: 40,
        alignment: 'top',
        auto: true,
        width: 0,
        labelLength: 4,
      })
    ).toBe(60);
  });

  it('keeps the automatic-label behavior for widgets that define labelType', () => {
    expect(
      calculateInputCanvasHeight({
        height: 40,
        alignment: 'top',
        auto: true,
        width: 0,
        labelLength: 0,
        labelType: 'auto',
      })
    ).toBe(60);
  });
});
