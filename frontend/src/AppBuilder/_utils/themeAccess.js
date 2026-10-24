import { baseTheme } from '@/AppBuilder/_stores/utils';

// Every plan can use the basic theme and the themes ToolJet ships (the server marks those isShipped); custom themes
// need the custom themes license. A version preview converts the app response to snake_case (useAppData), so the
// flags can arrive as is_basic and is_shipped.
const isBasic = (theme) => !!(theme?.isBasic ?? theme?.is_basic);
const isShipped = (theme) => !!(theme?.isShipped ?? theme?.is_shipped);

export const canUseTheme = (theme, hasThemeAccess) => !!hasThemeAccess || isBasic(theme) || isShipped(theme);

// The definition an app's colours come from: its own theme when the plan can use it, else the basic colours.
export const appliedThemeDefinition = (theme, hasThemeAccess) =>
  hasThemeAccess || isShipped(theme) ? theme?.definition || {} : baseTheme?.definition;
