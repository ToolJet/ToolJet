import fs from 'fs';
import path from 'path';
import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design Select QA queue (fix/ant-design-bugs-1.0). The pack's Select, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const design = { label: 'Design', value: 'design' };

describe('Ant Design Select: a value no option offers', () => {
  // Break this catches: the Select drops Value qa while no option offers it and never takes it back, so after the
  // options are edited to offer qa the field still shows the placeholder and exposes "".
  test('[PackComponent-ANTSELECT-001] a dropped value comes back when an option offers it, firing nothing', async () => {
    const v = await mountPack('antd', 'Select', { value: 'qa', options: [design] });
    await settle();
    expect(v.exposed.value).toBe('');

    await v.update({ props: { value: 'qa', options: [design, { label: 'QA', value: 'qa' }] } });
    await settle();

    expect(v.exposed.value).toBe('qa');
    expect(v.exposed.selectedOption).toEqual({ label: 'QA', value: 'qa', disabled: false });
    expect(v.events).toEqual([]);
  });

  // Break this catches: a value the user picked after the drop is overwritten by the dropped one when the options change.
  test('[PackComponent-ANTSELECT-002] a pick after the drop wins over the dropped value', async () => {
    const v = await mountPack('antd', 'Select', { value: 'qa', options: [design] }, { actions: new Map() });
    await settle();
    await v.run('setFieldValue', 'design');
    expect(v.exposed.value).toBe('design');

    await v.update({ props: { value: 'qa', options: [design, { label: 'QA', value: 'qa' }] } });
    await settle();

    expect(v.exposed.value).toBe('design');
  });
});

describe('Ant Design Select: a bound number', () => {
  // Break this catches: a number bound to a Select whose only option is the text '1' starts exposing the number 1, so a
  // query that compares the value with '1' stops matching. The value takes the option's own value, as a pick does.
  test('[PackComponent-ANTSELECT-003] the number 1 with only a text 1 option exposes the option value, text 1', async () => {
    const v = await mountPack('antd', 'Select', { value: 1, options: [{ label: 'Text one', value: '1' }] });
    await settle();

    expect(v.exposed.value).toBe('1');
    expect(v.exposed.selectedOption).toEqual({ label: 'Text one', value: '1', disabled: false });
    expect(v.events).toEqual([]);
  });

  // Characterization: with both a text '1' and a number 1 option, the number picks the number option.
  test('[PackComponent-ANTSELECT-004] the number 1 with text 1 and number 1 options picks the number option', async () => {
    const options = [
      { label: 'Text one', value: '1' },
      { label: 'Numeric one', value: 1 },
    ];
    const v = await mountPack('antd', 'Select', { value: 1, options });
    await settle();

    expect(v.exposed.value).toBe(1);
    expect(v.exposed.selectedOption).toEqual({ label: 'Numeric one', value: 1, disabled: false });
  });
});

describe('Ant Design Select: the open list when the page scrolls', () => {
  const openList = async (v) => {
    fireEvent.mouseDown(v.root().querySelector('.ant-select-selector'));
    await settle();
    expect(v.exposed.open).toBe(true);
  };

  // Break this catches: the list stays at its screen position while a Container around the field scrolls, so it
  // floats away from its field.
  test('[PackComponent-ANTSELECT-005] a scroll of an element around the field closes the list', async () => {
    const v = await mountPack('antd', 'Select', { options: [design] });
    await openList(v);
    const before = v.events.length;

    fireEvent.scroll(v.view.container);
    await settle();

    expect(v.exposed.open).toBe(false);
    expect(v.events.slice(before)).toEqual(['onOpenChange']);
  });

  // Break this catches: scrolling the list's own options (a long list) closes it.
  test('[PackComponent-ANTSELECT-006] a scroll that is not around the field leaves the list open', async () => {
    const v = await mountPack('antd', 'Select', { options: [design] });
    const aside = document.createElement('div');
    document.body.append(aside);
    await openList(v);

    fireEvent.scroll(aside);
    await settle();

    expect(v.exposed.open).toBe(true);
  });
});

describe('Ant Design fields: a long label above the field', () => {
  // jsdom lays nothing out, so this reads the pack's rule. Break this catches: a label on top wraps over many lines and
  // pushes the field out of its box; the ToolJet Text Input keeps the label on one line ended with an ellipsis.
  test('[PackComponent-ANTSELECT-007] a label above the field stays on one line, cut off with an ellipsis', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/antd/src/styles/pack.css'), 'utf8');
    const rule = (selector) => {
      const at = css.indexOf(`${selector} {`);
      return at < 0 ? '' : css.slice(at, css.indexOf('}', at));
    };
    const label = rule('.tj-ant-root .ant-form-item-vertical > .ant-form-item-row > .ant-form-item-label > label');

    expect(label).toMatch(/white-space:\s*nowrap/);
    expect(label).toMatch(/overflow:\s*hidden/);
    expect(label).toMatch(/text-overflow:\s*ellipsis/);
  });
});
