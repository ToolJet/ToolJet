import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A UI 2.0 Dialog's header and footer divider colours took a preset swatch but not a colour from the picker. They
 * default to #00000000, and the picker keeps the alpha of the colour it opened on: dragging to a red wrote #e11d4800,
 * still invisible. For a UI 2.0 widget a picker choice that changes a fully transparent colour is made opaque; setting
 * the alpha to 0 on a visible colour still writes a transparent one; native widgets are unchanged.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DynamicFxTypeRenderer } from '../DynamicFxTypeRenderer';
import { pickedColor } from '@/modules/common/components/BaseColorSwatches/pickedColor';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));
// The picker's own drag surfaces need layout; this stand-in reports a hue picked by dragging (alpha kept at 0).
jest.mock('react-color', () => ({
  SketchPicker: ({ onChangeComplete }) => (
    <button type="button" onClick={() => onChangeComplete({ rgb: { r: 225, g: 29, b: 72, a: 0 } })}>
      pick red
    </button>
  ),
}));

const RED = { r: 225, g: 29, b: 72 };

describe('a picker choice on a transparent colour', () => {
  test('a UI 2.0 colour that was fully transparent becomes opaque', () => {
    expect(pickedColor({ ...RED, a: 0 }, '#00000000', true)).toBe('#e11d48ff');
    expect(pickedColor({ ...RED, a: 0 }, 'transparent', true)).toBe('#e11d48ff');
  });

  test('alpha 0 chosen on a visible colour stays transparent; other choices keep their alpha', () => {
    expect(pickedColor({ ...RED, a: 0 }, '#e11d48ff', true)).toBe('#e11d4800');
    expect(pickedColor({ ...RED, a: 0.5 }, '#00000000', true)).toBe('#e11d4880');
    expect(pickedColor({ r: 0, g: 0, b: 0, a: 0 }, '#00000000', true)).toBe('#00000000');
  });

  test('native widgets keep their behaviour', () => {
    expect(pickedColor({ ...RED, a: 0 }, '#00000000', false)).toBe('#e11d4800');
    expect(pickedColor({ ...RED, a: 1 }, '#ffffff', false)).toBe('#e11d48ff');
  });

  test.each([
    ['ShadDialog', '#e11d48ff'],
    ['ModalV2', '#e11d4800'],
  ])('through the inspector field, %s writes %s', async (component, written) => {
    const onChange = jest.fn();
    render(
      <DynamicFxTypeRenderer
        paramType="colorSwatches"
        component={component}
        componentId="dialog1"
        paramName="headerDividerColor"
        value="#00000000"
        onChange={onChange}
        cyLabel="divider"
        meta={{}}
      />
    );
    fireEvent.click(document.querySelector('[data-cy="divider-picker"]'));
    // The popover positions itself after it opens.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    fireEvent.click(screen.getByText('pick red'));
    expect(onChange).toHaveBeenLastCalledWith(written);
  });
});
