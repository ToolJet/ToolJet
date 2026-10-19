// Release audit (Codex native fixture tabs-style-native-94e04f0): two Tabs styles applied to only some variants. The
// Steps labels kept a fixed 14px, ignoring Tab font size (--tb-font), and Tab bar background (--tb-list-bg) painted
// only the Pills bar, Underline and Steps bars staying transparent. The inspector names neither as variant-specific, so
// every variant now reads both. jsdom applies no Tailwind, so this checks the classes that read the variables; the
// variables themselves are checked in ShadTabs.spec.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TabStrip } from '@/AppBuilder/Widgets/Ui2/Tabs/TabStrip';
import { tabsFromProperties } from '@/AppBuilder/Widgets/Ui2/Tabs/tabsModel';

const tabs = tabsFromProperties({
  useDynamicOptions: true,
  tabs: [
    { id: 'overview', title: 'Overview' },
    { id: 'activity', title: 'Activity' },
  ],
});
const strip = (variant) =>
  render(
    <TabStrip
      widgetId="tabs1"
      tabs={tabs}
      currentTab="activity"
      variant={variant}
      align="left"
      stepIndex={1}
      linear={false}
      onPick={() => {}}
    />
  );

describe.each(['pills', 'underline', 'steps'])('%s', (variant) => {
  test('each tab label reads the Tab font size', () => {
    strip(variant);
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.className).toContain('tw-text-[length:var(--tb-font,0.875rem)]');
    }
  });

  test('the tab bar reads the Tab bar background', () => {
    strip(variant);
    expect(screen.getByRole('tablist').className).toMatch(/tw-bg-\[color:var\(--tb-list-bg,/);
  });
});
