import { calculateInputCanvasHeight } from '../componentsSliceUtils';

describe('calculateInputCanvasHeight', () => {
  it('does not add top-label height when an input label is empty and expansion is disabled', () => {
    expect(
      calculateInputCanvasHeight({
        height: 40,
        alignment: 'top',
        auto: true,
        width: 0,
        labelLength: 0,
        expandFieldIfLabelEmpty: false,
      })
    ).toBe(40);
  });

  it('adds top-label height when an input label is empty and expansion is enabled', () => {
    expect(
      calculateInputCanvasHeight({
        height: 40,
        alignment: 'top',
        auto: true,
        width: 0,
        labelLength: 0,
        expandFieldIfLabelEmpty: true,
      })
    ).toBe(60);
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
