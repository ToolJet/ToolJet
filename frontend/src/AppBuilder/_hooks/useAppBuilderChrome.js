import { useEffect } from 'react';
import { getAppBuilderTypographyVariables } from '@/AppBuilder/panelLayout';

// Panels, menus and tooltips portal to <body>, outside the editor wrapper, so the editor chrome's type
// variables and its `app-builder-chrome` (+ `--dark`) scope classes sit on <body> and leave with the
// editor; shared styles fall back to their own values. Widgets reset the variables (theme.scss) so
// customer apps never see them.
export default function useAppBuilderChrome(enabled, darkMode = false) {
  useEffect(() => {
    if (!enabled) return;
    const variables = Object.entries(getAppBuilderTypographyVariables());
    variables.forEach(([name, value]) => document.body.style.setProperty(name, value));
    document.body.classList.add('app-builder-chrome');
    document.body.classList.toggle('app-builder-chrome--dark', darkMode);
    return () => {
      variables.forEach(([name]) => document.body.style.removeProperty(name));
      document.body.classList.remove('app-builder-chrome', 'app-builder-chrome--dark');
    };
  }, [enabled, darkMode]);
}
