import { useEffect } from 'react';
import { getAppBuilderTypographyVariables } from '@/AppBuilder/panelLayout';

// Panels, menus and tooltips portal to <body>, outside the editor wrapper, so the editor's type
// variables sit on <body> and leave with the editor; shared styles fall back to their own values.
export default function useAppBuilderTypography(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const variables = Object.entries(getAppBuilderTypographyVariables());
    variables.forEach(([name, value]) => document.body.style.setProperty(name, value));
    return () => variables.forEach(([name]) => document.body.style.removeProperty(name));
  }, [enabled]);
}
