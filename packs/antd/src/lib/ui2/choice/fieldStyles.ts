import { ToolJet } from '@tooljet/custom-component-sdk';
import { RADIUS_HINT, THEME_COLOR as T, useThemeColor } from '../../themeStyles';

// The styles UI 2.0's form fields share (Select, Multiselect, Combobox, the date and time pickers), with UI 2.0's names,
// labels and order. Each defaults to the theme colour it draws; left there, it falls back to the app theme.
const color = (name: string, label: string, initialValue: string) => useThemeColor(name, label, initialValue);

export const useFieldStyles = (accentLabel = 'Accent (focus ring, selection)') => ({
  labelColor: color('labelColor', 'Label color', T.text),
  helpTextColor: color('helpTextColor', 'Help text color', T.muted),
  backgroundColor: color('backgroundColor', 'Field background', T.surface),
  textColor: color('textColor', 'Field text color', T.text),
  placeholderColor: color('placeholderColor', 'Placeholder color', T.muted),
  borderColor: color('borderColor', 'Field border color', T.border),
  accentColor: color('accentColor', accentLabel, T.brand),
  errorColor: color('errorColor', 'Error color (message and border)', T.danger),
  borderRadius: ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Field radius', placeholder: RADIUS_HINT, inspector: 'numberInput' }),
});

export const useColorStyle = color;

/** The Date and time and Time pickers' styles after the field's: the icon and the popover. */
export const usePopoverStyles = (iconLabel: string) => ({
  iconColor: color('iconColor', iconLabel, T.muted),
  popoverBackgroundColor: color('popoverBackgroundColor', 'Popover background', T.surface),
  popoverTextColor: color('popoverTextColor', 'Popover text color', T.text),
  hoverColor: color('hoverColor', 'Popover item hover background', T.surfaceMuted),
  selectedTextColor: color('selectedTextColor', 'Selected item text color (on the accent)', T.surface),
});

/** The pack's Disable property (kept for apps that set it) or the host's Disable and Loading (setDisable, setLoading). */
export const useBusy = (disabledProp: unknown) => {
  const host = ToolJet.useControlState();
  return { disabled: disabledProp === true || !!host.disabled || !!host.loading, loading: !!host.loading };
};
