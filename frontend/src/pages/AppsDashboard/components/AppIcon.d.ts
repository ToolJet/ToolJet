// Types for AppIcon.jsx, which TS can't infer from its untyped props.
// Delete this file once AppIcon is converted to TypeScript.
import type { FC } from 'react';

export interface AppIconProps {
  /** Legacy icon name stored on the app; unknown names fall back to a default icon. */
  icon?: string;
  /** One of `APP_ICON_COLORS`; anything else renders the neutral icon color. */
  color?: string;
  size?: number;
  className?: string;
}

declare const AppIcon: FC<AppIconProps>;
export default AppIcon;

export declare const APP_ICON_COLORS: string[];
export declare const ICONS_BY_LEGACY_NAME: Record<string, FC<{ size?: number; className?: string }>>;
