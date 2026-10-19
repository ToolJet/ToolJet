import { baseTheme } from '@/AppBuilder/_stores/utils';

// Every plan can use the basic theme and the themes ToolJet ships (the server marks those isShipped); custom themes
// need the custom themes license.
export const canUseTheme = (theme, hasThemeAccess) => !!hasThemeAccess || !!theme?.isBasic || !!theme?.isShipped;

// The definition an app's colours come from: its own theme when the plan can use it, else the basic colours.
export const appliedThemeDefinition = (theme, hasThemeAccess) =>
  hasThemeAccess || theme?.isShipped ? theme?.definition || {} : baseTheme?.definition;
