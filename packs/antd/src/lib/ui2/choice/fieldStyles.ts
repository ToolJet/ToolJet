import { ToolJet } from '@tooljet/custom-component-sdk';

// The styles UI 2.0's form fields share (Select, Multiselect, Combobox, the date and time pickers), with UI 2.0's names,
// labels and order. Unset, each falls back to the app theme.
const color = (name: string, label: string) => ToolJet.useStyleString({ name, label, inspector: 'color', initialValue: '' });

export const useFieldStyles = (accentLabel = 'Accent (focus ring, selection)') => ({
  labelColor: color('labelColor', 'Label color'),
  helpTextColor: color('helpTextColor', 'Help text color'),
  backgroundColor: color('backgroundColor', 'Field background'),
  textColor: color('textColor', 'Field text color'),
  placeholderColor: color('placeholderColor', 'Placeholder color'),
  borderColor: color('borderColor', 'Field border color'),
  accentColor: color('accentColor', accentLabel),
  errorColor: color('errorColor', 'Error color (message and border)'),
  borderRadius: ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Field radius', initialValue: '' }),
});

export const useColorStyle = color;

/** The Date and time and Time pickers' styles after the field's: the icon and the popover. */
export const usePopoverStyles = (iconLabel: string) => ({
  iconColor: color('iconColor', iconLabel),
  popoverBackgroundColor: color('popoverBackgroundColor', 'Popover background'),
  popoverTextColor: color('popoverTextColor', 'Popover text color'),
  hoverColor: color('hoverColor', 'Popover item hover background'),
  selectedTextColor: color('selectedTextColor', 'Selected item text color (on the accent)'),
});

/** The pack's Disable property (kept for apps that set it) or the host's Disable and Loading (setDisable, setLoading). */
export const useBusy = (disabledProp: unknown) => {
  const host = ToolJet.useControlState();
  return { disabled: disabledProp === true || !!host.disabled || !!host.loading, loading: !!host.loading };
};
