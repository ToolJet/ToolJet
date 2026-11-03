import { ToolJet } from '@tooljet/custom-component-sdk';
import { TOKEN, useThemeColor, useThemeRadius, type Token } from '../../styleDefaults';

// The styles UI 2.0's form fields share (Select, Multiselect, Combobox, the date and time pickers), with UI 2.0's names,
// labels and order. Each defaults to the theme token it draws (styleDefaults), and reads back '' at that default.
const color = (name: string, label: string, token: Token) => useThemeColor(name, label, token);

export const useFieldStyles = (accentLabel = 'Accent (focus ring, selection)') => ({
  labelColor: color('labelColor', 'Label color', TOKEN.text),
  helpTextColor: color('helpTextColor', 'Help text color', TOKEN.mutedText),
  backgroundColor: color('backgroundColor', 'Field background', TOKEN.surface),
  textColor: color('textColor', 'Field text color', TOKEN.text),
  placeholderColor: color('placeholderColor', 'Placeholder color', TOKEN.mutedText),
  borderColor: color('borderColor', 'Field border color', TOKEN.border),
  accentColor: color('accentColor', accentLabel, TOKEN.brand),
  errorColor: color('errorColor', 'Error color (message and border)', TOKEN.error),
  borderRadius: useThemeRadius('borderRadius', 'Field radius'),
});

export const useColorStyle = color;

/** The Date and time and Time pickers' styles after the field's: the icon and the popover. */
export const usePopoverStyles = (iconLabel: string) => ({
  // The icon takes the field's text colour (currentColor at 70% opacity).
  iconColor: color('iconColor', iconLabel, TOKEN.text),
  popoverBackgroundColor: color('popoverBackgroundColor', 'Popover background', TOKEN.surface),
  popoverTextColor: color('popoverTextColor', 'Popover text color', TOKEN.text),
  hoverColor: color('hoverColor', 'Popover item hover background', TOKEN.muted),
  selectedTextColor: color('selectedTextColor', 'Selected item text color (on the accent)', TOKEN.surface),
});

/** The pack's Disable property (kept for apps that set it) or the host's Disable and Loading (setDisable, setLoading). */
export const useBusy = (disabledProp: unknown) => {
  const host = ToolJet.useControlState();
  return { disabled: disabledProp === true || !!host.disabled || !!host.loading, loading: !!host.loading };
};
