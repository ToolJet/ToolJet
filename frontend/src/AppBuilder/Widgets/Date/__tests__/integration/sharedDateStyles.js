import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Shared STYLE characterization for the four Widgets/Date pickers — DatePickerV2,
// DaterangePicker, DatetimePickerV2 and TimePicker. All four render through the
// same BaseDateComponent -> DatepickerInput path, so STYLE-001..004 (visibility,
// disabledState, boxShadow, border radius) exercise identical production code in
// every widget.
//
// Each spec calls `sharedDateStyleTests()` once and wires the returned callbacks
// to its own literal `[<Widget>-STYLE-00x]` titles. The behaviour lives here in
// one place — a change to the shared style contract is a one-line edit instead of
// four — while each per-widget scenario ID stays spelled out in its spec, which is
// what the widget contract validator statically parses to prove coverage.
//
// STYLE-004's config key differs (`fieldBorderRadius` for the single pickers,
// `borderRadius` for the range picker), so it is passed in as `borderRadiusKey`.
export function sharedDateStyleTests({ widget, wrapper, input, borderRadiusKey = 'fieldBorderRadius' }) {
  return {
    // Break this catches: dropping the `invisible: !visibility` class mapping
    // (BaseDateComponent.jsx), so a hidden picker stays visible.
    visibility: async () => {
      widget.render({ properties: { visibility: binding('{{false}}') } });

      await waitFor(() => expect(wrapper()).toBeInTheDocument());
      expect(wrapper()).toHaveClass('invisible');
    },
    // Break this catches: dropping `disabled`/`aria-disabled` from the input
    // (DatepickerInput.jsx), so a disabled picker stays editable.
    disabledState: async () => {
      widget.render({ properties: { disabledState: binding('{{true}}') } });

      await waitFor(() => expect(input()).toBeInTheDocument());
      expect(input()).toBeDisabled();
      expect(input()).toHaveAttribute('aria-disabled', 'true');
    },
    // Break this catches: not forwarding `boxShadow` to the input inline style
    // (BaseDateComponent.jsx -> DatepickerInput.jsx).
    boxShadow: async () => {
      widget.render({ styles: { boxShadow: binding('0px 0px 5px red') } });

      await waitFor(() => expect(input()).toBeInTheDocument());
      expect(input()).toHaveStyle({ boxShadow: '0px 0px 5px red' });
    },
    // Break this catches: not forwarding the border-radius style to the input
    // inline border-radius (BaseDateComponent.jsx -> DatepickerInput.jsx).
    borderRadius: async () => {
      widget.render({ styles: { [borderRadiusKey]: binding('{{10}}') } });

      await waitFor(() => expect(input()).toBeInTheDocument());
      expect(input()).toHaveStyle({ borderRadius: '10px' });
    },
  };
}
