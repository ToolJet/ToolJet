import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { componentSettings, installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { AccordionContainer } from '../../../../../../packs/shadcn/src/components/AccordionContainer';
import { Dialog as ShadDialog } from '../../../../../../packs/shadcn/src/components/Dialog';
import { ListView } from '../../../../../../packs/shadcn/src/components/ListView';
import { Collapse } from '../../../../../../packs/antd/src/components/Navigation';
import { List as AntList, Modal as AntModal } from '../../../../../../packs/antd/src/components/Containers';
import { Dialog as MuiDialog, List as MuiList } from '../../../../../../packs/mui/src/components/Containers';

installBrowserStubs();

// QA: Dynamic height was missing or did nothing on pack sub containers. With Dynamic height on, a released app sizes
// every drop area to its components (the host's fitDropAreas): a height the component gives a drop area, an accordion
// section's or a dialog body's, is its minimum, so the area grows past it instead of spilling over the next section or
// scrolling. Lists draw their rows of components as tall as the components need. The pack sources are the real ones;
// only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// The element matching `selector` in the page or any shadow root under it: a drop area sits in the component's
// shadow root, a dialog's body in the popup layer's.
const deepQuery = (selector, root = document) => {
  const hit = root.querySelector(selector);
  if (hit) return hit;
  for (const el of root.querySelectorAll('*')) {
    const found = el.shadowRoot ? deepQuery(selector, el.shadowRoot) : null;
    if (found) return found;
  }
  return null;
};

let mounts = 0;
const mount = async (Component, name, props, { fit }) => {
  loadLibraryModule.mockResolvedValue({ [name]: Component });
  mounts += 1;
  const cacheKey = `drop-area-fit-${mounts}`;
  const actions = new Map();
  const Harness = () => {
    const [popupSlotNames, setPopupSlotNames] = React.useState([]);
    const registerPopupSlot = React.useCallback((slot) => {
      setPopupSlotNames((names) => (names.includes(slot) ? names : [...names, slot]));
      return () => setPopupSlotNames((names) => names.filter((n) => n !== slot));
    }, []);
    const host = React.useMemo(
      () => ({ ...makeHost(name), registerPopupSlot, fitDropAreas: fit }),
      [registerPopupSlot]
    );
    return (
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey={cacheKey}
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={actions}
        host={host}
        dataCy={name}
        popupSlotNames={popupSlotNames}
        renderPopupSlot={() => <div />}
      />
    );
  };
  render(<Harness />);
  return actions;
};

const dropArea = async (slot) => {
  await waitFor(() => expect(deepQuery(`[data-tj-slot="${slot}"]`)).toBeTruthy());
  return deepQuery(`[data-tj-slot="${slot}"]`);
};

describe('a pack section with Dynamic height', () => {
  test.each([
    ['shadcn AccordionContainer', AccordionContainer, 'AccordionContainer', 'section_general'],
    ['Ant Collapse', Collapse, 'Collapse', 'panel_panel1'],
  ])(
    '[PackComponent-DYNHEIGHT-009] %s: an open section grows past its section height, never below it',
    async (_pack, Component, name, slot) => {
      // Break this catches: the section held at its 160px section height while its components grew, so they spilled
      // over the next section's header and the widget never grew (QA: Dynamic height missing on pack sub containers).
      await mount(Component, name, {}, { fit: true });
      const area = await dropArea(slot);

      expect(area.style.height).toBe('auto');
      expect(area.style.minHeight).toBe('160px');
    }
  );

  test('[PackComponent-DYNHEIGHT-010] without Dynamic height a section keeps its section height', async () => {
    // Break this catches: every saved accordion's sections resized to their components with Dynamic height off.
    await mount(AccordionContainer, 'AccordionContainer', {}, { fit: false });
    const area = await dropArea('section_general');

    expect(area.style.height).toBe('160px');
  });
});

describe('a pack dialog with Dynamic height', () => {
  test.each([
    ['shadcn Dialog', ShadDialog, 'Dialog', 'open', '240px'],
    ['Ant Modal', AntModal, 'Modal', 'show', '200px'],
    ['MUI Dialog', MuiDialog, 'Dialog', 'open', '200px'],
  ])(
    '[PackComponent-DYNHEIGHT-011] %s: its body grows past its body height, never below it',
    async (_pack, Component, name, openAction, bodyHeight) => {
      // Break this catches: the body held at its Body height with its components scrolling inside it, where a native
      // Modal with Dynamic height grows with them.
      const actions = await mount(Component, name, {}, { fit: true });
      await waitFor(() => expect(actions.get(openAction)).toBeTruthy());
      act(() => actions.get(openAction)());
      const area = await dropArea('body');

      expect(area.style.height).toBe('auto');
      expect(area.style.minHeight).toBe(bodyHeight);
    }
  );

  test('[PackComponent-DYNHEIGHT-012] without Dynamic height a dialog keeps its body height', async () => {
    // Break this catches: every saved dialog's body resized to its components with Dynamic height off.
    const actions = await mount(ShadDialog, 'Dialog', {}, { fit: false });
    await waitFor(() => expect(actions.get('open')).toBeTruthy());
    act(() => actions.get('open')());
    const area = await dropArea('body');

    expect(area.style.height).toBe('240px');
  });
});

describe('a pack list with Dynamic height', () => {
  test.each([
    ['shadcn ListView', ListView],
    ['Ant List', AntList],
    ['MUI List', MuiList],
  ])(
    '[PackComponent-DYNHEIGHT-013] %s can fit its content, so the Inspector offers Dynamic height',
    (_pack, Component) => {
      // Break this catches: a list (the MUI List was) without the toggle, its rows clipped and scrolling in its box.
      expect(componentSettings(Component).fit).toBe(true);
    }
  );

  test('[PackComponent-DYNHEIGHT-014] the shadcn ListView gives its rows of components the item height as a minimum the host can grow', async () => {
    // Break this catches: a fixed inline height on the row, which clipped the canvas the host drew taller for the
    // row's components (the long text cut off, the component under it hidden).
    await mount(ListView, 'ListView', { itemContent: 'components' }, { fit: false });
    const rows = () => [
      ...(deepQuery('[data-cy="ListView"]')?.shadowRoot?.querySelectorAll('.u2l-list-item.is-canvas') ?? []),
    ];
    await waitFor(() => expect(rows()).toHaveLength(3));

    rows().forEach((row) => {
      expect(row.style.height).toBe('');
      expect(row.style.getPropertyValue('--lv-row-height')).toBe('72px');
    });
  });
});
