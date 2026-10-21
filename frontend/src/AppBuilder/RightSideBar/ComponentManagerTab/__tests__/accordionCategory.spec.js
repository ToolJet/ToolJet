// The UI 2.0 Accordion draws text sections from its items and holds no components, yet it was listed in Layout beside
// the containers (FlexContainer, Tabs, List view, Dialog), where a builder expects to drop components into what they
// add. It is listed in Data display, with the Key-value list and the Timeline.
jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));

import { SHADCN_SECTIONS } from '../ComponentsManagerTab';

const section = (title) => SHADCN_SECTIONS.find((s) => s.title === title).items;

describe('UI 2.0 components panel', () => {
  test('lists the Accordion in Data display, beside the Key-value list and the Timeline', () => {
    const display = section('Data display');
    expect(display).toContain('ShadAccordion');
    expect(Math.abs(display.indexOf('ShadAccordion') - display.indexOf('ShadTimeline'))).toBe(1);
    expect(display).toContain('ShadKeyValue');
  });

  test('keeps it out of Layout, and lists it once', () => {
    expect(section('Layout')).not.toContain('ShadAccordion');
    expect(SHADCN_SECTIONS.flatMap((s) => s.items).filter((name) => name === 'ShadAccordion')).toHaveLength(1);
  });
});
