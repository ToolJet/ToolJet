import React from 'react';
import { shallow } from 'zustand/shallow';
import { toV2 } from '@tooljet/widget-definitions';
import useStore from '@/AppBuilder/_stores/store';
import useThemeAccess from '@/AppBuilder/_hooks/useThemeAccess';
import { appliedThemeDefinition } from '@/AppBuilder/_utils/themeAccess';
import { ThemeTokenField } from './ThemeTokenField';

/** ThemeTokenField with the items of the app's theme (the one its colours come from: appliedThemeDefinition). */
export const ThemeStyleField = ({ kind, ...props }) => {
  const theme = useStore((state) => state.globalSettings.theme, shallow);
  const themeAccess = useThemeAccess();
  const items = toV2(appliedThemeDefinition(theme, themeAccess))[kind];
  return <ThemeTokenField kind={kind} items={items} {...props} />;
};
