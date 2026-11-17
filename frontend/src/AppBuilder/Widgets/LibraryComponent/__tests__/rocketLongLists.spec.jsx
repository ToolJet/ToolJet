import fs from 'fs';
import path from 'path';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA: a Rocket 2.0 Accordion given 1000 items drew the first 200 and dropped the rest with no message. Its sections are
// text, so it draws them all, as Text Tabs does. Rocket Tabs keeps its limit of 50 (each tab is a canvas; a large list
// bound by mistake froze the page), stated in its Tabs field help; Accordion Container, a canvas per section, the same
// (PF-116). The pack components, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const COUNT = 1000;
const PACKS = path.resolve(__dirname, '../../../../../../packs');
// A field's help as the built pack lists it (the inspector's tooltip).
const helpOf = (component, prop) =>
  JSON.parse(fs.readFileSync(path.join(PACKS, 'shadcn/dist/manifest.json'), 'utf8')).components[component].props.find(
    (p) => p.name === prop
  ).description;

describe('Rocket lists longer than their old limit', () => {
  test('[PackComponent-LONGLIST-001] Accordion: 1000 items, 1000 headers', async () => {
    const items = Array.from({ length: COUNT }, (_, i) => ({
      value: `v${i}`,
      title: `Title ${i}`,
      content: `Body ${i}`,
    }));
    const v = await mountPack('shadcn', 'Accordion', { items });
    const headers = [...v.root().querySelectorAll('button[aria-expanded]')];
    expect(headers).toHaveLength(COUNT);
    expect(headers[COUNT - 1].textContent).toContain(`Title ${COUNT - 1}`);
  });

  test('[PackComponent-LONGLIST-002] Text Tabs: 1000 tabs, 1000 tab buttons', async () => {
    const tabs = Array.from({ length: COUNT }, (_, i) => ({ id: `t${i}`, label: `Tab ${i}` }));
    const v = await mountPack('shadcn', 'Tabs', { tabs });
    expect(v.root().querySelectorAll('[role="tab"]')).toHaveLength(COUNT);
  });

  test('[PackComponent-LONGLIST-003] Tabs (a canvas per tab) still draws its first 50', async () => {
    const tabs = Array.from({ length: 60 }, (_, i) => ({ id: `t${i}`, label: `Tab ${i}` }));
    const v = await mountPack('shadcn', 'TabsContainer', { tabs });
    expect(v.root().querySelectorAll('[role="tab"]')).toHaveLength(50);
  });

  test('[PackComponent-LONGLIST-004] Accordion Container (a canvas per section) still draws its first 50', async () => {
    const sections = Array.from({ length: 60 }, (_, i) => ({ id: `s${i}`, title: `Sec ${i}` }));
    const v = await mountPack('shadcn', 'AccordionContainer', { sections });
    expect(v.root().querySelectorAll('button[aria-expanded]')).toHaveLength(50);
  });

  test('[PackComponent-LONGLIST-005] Accordion Container: its Sections field help states the limit', () => {
    expect(helpOf('AccordionContainer', 'sections')).toMatch(/Up to 50 sections are shown/);
  });
});
