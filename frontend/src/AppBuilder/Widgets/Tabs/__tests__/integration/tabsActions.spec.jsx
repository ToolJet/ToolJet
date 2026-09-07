import React from 'react';
import { waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { createWidgetHarness, drain, setVariableOn } from '../../../__tests__/integration/widgetHarness';

const TABS_ID = 'tabs-1';
const DndWrapper = ({ children }) => <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
const store = () => useStore.getState();
const tabItems = [
  { id: 'first', title: 'First', visible: true, disable: false },
  { id: 'middle', title: 'Middle', visible: true, disable: false },
  { id: 'last', title: 'Last', visible: true, disable: false },
];

const widget = createWidgetHarness({
  componentType: 'Tabs',
  handle: 'tabs1',
  id: TABS_ID,
  widgetHeight: 450,
  wrapper: DndWrapper,
  defaultProperties: {
    useDynamicOptions: { value: false },
    tabItems: { value: tabItems },
    defaultTab: { value: 'first' },
    hideTabs: { value: false },
    renderOnlyActiveTab: { value: false },
    scrollToTopOnTabSwitch: { value: false },
    dynamicHeight: { value: false },
    loadingState: { value: false },
    visibility: { value: true },
    disabledState: { value: false },
  },
  defaultStyles: {
    visibility: { value: true },
    disabledState: { value: false },
    tabWidth: { value: 'auto' },
    transition: { value: 'none' },
    padding: { value: 'default' },
  },
});

describe('Tabs adjacent component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('Next skips a tab hidden through the public Tabs action and publishes the destination before onTabSwitch', async () => {
    const { queryByText } = widget.render({
      events: setVariableOn(TABS_ID, 'onTabSwitch', {
        key: 'tabSeenByHandler',
        value: '{{components.tabs1.currentTab}}',
      }),
    });

    await waitFor(() => expect(widget.exposed().setNextTab).toBeInstanceOf(Function));
    store().setSelectedComponents([TABS_ID]);

    await widget.session.store.act(async () => {
      await widget.exposed().setTabVisibility('middle', false);
    });
    await waitFor(() => expect(queryByText('Middle')).not.toBeInTheDocument());

    await widget.session.store.act(async () => {
      await widget.exposed().setNextTab();
    });
    await drain();

    expect(widget.exposed().currentTab).toBe('last');
    expect(widget.exposed().currentTabTitle).toBe('Last');
    expect(widget.variables().tabSeenByHandler).toBe('last');
    expect(store().selectedComponents).toEqual([]);
  });

  test('Previous skips a tab disabled through the public Tabs action', async () => {
    widget.render({ properties: { defaultTab: { value: 'last' } } });

    await waitFor(() => expect(widget.exposed().setPreviousTab).toBeInstanceOf(Function));
    await widget.session.store.act(async () => {
      await widget.exposed().setTabDisable('middle', true);
    });
    await waitFor(() => expect(widget.exposed().currentTab).toBe('last'));

    await widget.session.store.act(async () => {
      await widget.exposed().setPreviousTab();
    });

    expect(widget.exposed().currentTab).toBe('first');
    expect(widget.exposed().currentTabTitle).toBe('First');
  });

  test('a boundary action preserves selection and does not fire onTabSwitch', async () => {
    widget.render({
      events: setVariableOn(TABS_ID, 'onTabSwitch', {
        key: 'boundaryEvent',
        value: 'FIRED',
      }),
    });

    await waitFor(() => expect(widget.exposed().setPreviousTab).toBeInstanceOf(Function));
    store().setSelectedComponents([TABS_ID]);

    await widget.session.store.act(async () => {
      await widget.exposed().setPreviousTab();
    });
    await drain();

    expect(widget.exposed().currentTab).toBe('first');
    expect(widget.variables().boundaryEvent).toBeUndefined();
    expect(store().selectedComponents).toEqual([TABS_ID]);
  });

  test('programmatic navigation remains available when the whole widget is hidden and disabled', async () => {
    widget.render({
      properties: {
        visibility: { value: false },
        disabledState: { value: true },
      },
    });

    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
    expect(widget.exposed().isDisabled).toBe(true);

    await widget.session.store.act(async () => {
      await widget.exposed().setNextTab();
    });

    expect(widget.exposed().currentTab).toBe('middle');
    expect(widget.exposed().currentTabTitle).toBe('Middle');
  });

  test('missing tab data keeps adjacent actions available as safe no-ops', async () => {
    widget.render({ properties: { tabItems: { value: null } } });

    await waitFor(() => expect(widget.exposed().setNextTab).toBeInstanceOf(Function));

    await widget.session.store.act(async () => {
      await widget.exposed().setNextTab();
      await widget.exposed().setPreviousTab();
    });

    expect(widget.exposed().currentTab).toBe('first');
  });

  test('malformed tab entries are ignored instead of crashing adjacent actions', async () => {
    widget.render({ properties: { tabItems: { value: [null] } } });

    await waitFor(() => expect(widget.exposed().setNextTab).toBeInstanceOf(Function));

    await widget.session.store.act(async () => {
      await widget.exposed().setNextTab();
    });

    expect(widget.exposed().currentTab).toBe('first');
  });
});
