import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { componentOf, defaultsOf, installGuards, mountCase, problemsOf, styleDefaultsOf } from '../fuzz/harness';
import { initials } from '../../../packHooks';

// Defects a hand build of a yacht charter desk found (2026-10-10), pinned so they stay fixed.
installGuards();

const mount = async (name, properties = {}, extra = {}) => {
  const result = await mountCase({
    name,
    properties: { ...defaultsOf(name), ...properties },
    styles: styleDefaultsOf(name),
    ...extra,
  });
  return { ...result, problems: () => problemsOf(result.stats) };
};

describe('List view', () => {
  it('writes its rows to the store outside render, so a component reading them never updates during its render', async () => {
    const errors = [];
    const spy = jest.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));
    // A component subscribed to the list's rows, as each row's widgets are.
    const Reader = () => {
      useStore((state) => state.resolvedStore?.modules?.canvas?.customResolvables?.lv1);
      return null;
    };
    const ListView = componentOf('ShadListView');
    const props = {
      id: 'lv1',
      componentType: 'ShadListView',
      properties: { ...defaultsOf('ShadListView'), data: [{ id: 1 }, { id: 2 }, { id: 3 }] },
      styles: styleDefaultsOf('ShadListView'),
      setExposedVariables: () => {},
      setExposedVariable: () => {},
      fireEvent: () => Promise.resolve(),
      currentMode: 'view',
      height: 300,
      width: 400,
    };
    let view;
    await act(async () => {
      view = render(
        <>
          <Reader />
          <ListView {...props} />
        </>
      );
    });
    expect(document.querySelectorAll('[role=listitem]')).toHaveLength(3);
    await act(async () =>
      view.rerender(
        <>
          <Reader />
          <ListView {...props} properties={{ ...props.properties, data: [{ id: 4 }, { id: 5 }] }} />
        </>
      )
    );
    expect(document.querySelectorAll('[role=listitem]')).toHaveLength(2);
    view.unmount();
    spy.mockRestore();
    expect(errors.filter((e) => /Cannot update a component/.test(e))).toEqual([]);
  });
});

describe('Table row clicks', () => {
  const data = [
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Grace' },
  ];
  const rowOf = (text) => [...document.querySelectorAll('tr')].find((tr) => tr.textContent.includes(text));

  it('by default a second click keeps the row selected and fires onRowClicked with the row', async () => {
    const { stats, problems, unmount } = await mount('ShadTable', { data });
    await act(async () => fireEvent.click(rowOf('Ada')));
    await act(async () => fireEvent.click(rowOf('Ada')));
    expect(stats.events.filter((e) => e === 'onRowClicked')).toHaveLength(2);
    expect(stats.exposed.selectedRow).toMatchObject({ name: 'Ada' });
    unmount();
    expect(problems()).toEqual([]);
  });

  it('with deselection on, the deselecting click is a selection change only', async () => {
    const { stats, problems, unmount } = await mount('ShadTable', { data, disableRowDeselection: false });
    await act(async () => fireEvent.click(rowOf('Ada')));
    stats.events.length = 0;
    await act(async () => fireEvent.click(rowOf('Ada')));
    expect(stats.events).toEqual(['onSelectionChanged']);
    unmount();
    expect(problems()).toEqual([]);
  });

  it('treats an unset disableRowDeselection (an MCP-made table) as on', async () => {
    const properties = { ...defaultsOf('ShadTable'), data };
    delete properties.disableRowDeselection;
    const { stats, unmount } = await mountCase({ name: 'ShadTable', properties, styles: {} });
    await act(async () => fireEvent.click(rowOf('Grace')));
    await act(async () => fireEvent.click(rowOf('Grace')));
    expect(stats.exposed.selectedRow).toMatchObject({ name: 'Grace' });
    unmount();
  });
});

describe('Avatar', () => {
  it('reads initials from the first and last word, skipping words with no letter', () => {
    expect(initials('Yusuf & Leyla Demir')).toBe('YD');
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('benoît lefèvre')).toBe('BL');
    expect(initials('Cher')).toBe('C');
    expect(initials('& -')).toBe('');
    expect(initials(null)).toBe('');
  });

  it('sizes avatars through variables the !important classes read, with the font and overlap scaled', async () => {
    const { problems, unmount } = await mount('ShadAvatar', { names: ['Oliver Grant', 'Isla Mackenzie'], size: 60 });
    const group = document.querySelector('.tj-shadcn [style*="--av-size"]');
    expect(group.style.getPropertyValue('--av-size')).toBe('60px');
    expect(group.style.getPropertyValue('--av-font')).toBe('24px');
    const avatar = document.querySelector('[title="Oliver Grant"]');
    expect(avatar.className).toContain('h-[var(--av-size)]');
    expect(avatar.className).not.toMatch(/\bh-8\b/);
    unmount();
    expect(problems()).toEqual([]);
  });
});

describe('Stat', () => {
  const footnote = 'Up from 182,400 last season, with three charters still to settle';

  it('in a fixed box, fills the box and keeps a long footnote inside it', async () => {
    const { problems, unmount } = await mount('ShadStat', { footnote, dynamicHeight: false }, { height: 120 });
    const note = [...document.querySelectorAll('span')].find((s) => s.textContent === footnote);
    expect(note.className).toContain('line-clamp-2');
    expect(note.getAttribute('title')).toBe(footnote);
    expect(note.closest('[style*="height"]').style.height).toBe('120px');
    unmount();
    expect(problems()).toEqual([]);
  });

  it('with dynamic height on, still fits its content (no fixed card height to ratchet on)', async () => {
    const { unmount } = await mount('ShadStat', { footnote, dynamicHeight: true }, { height: 120 });
    const note = [...document.querySelectorAll('span')].find((s) => s.textContent === footnote);
    expect(note.className).not.toContain('line-clamp-2');
    unmount();
  });
});
