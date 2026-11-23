import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { componentTypes } from '@/AppBuilder/WidgetManager/componentTypes';
import { LibraryComponentProperties } from '../../index';

const libraryComponentMeta = componentTypes.find((type) => type.component === 'LibraryComponent');

const CORRELATION_ID = '44444444-4444-4444-4444-444444444444';
const DASHLESS = CORRELATION_ID.replace(/-/g, '');

const library = {
  id: 'lib-demo',
  correlationId: CORRELATION_ID,
  name: 'Palette Tiles Demo',
  revisions: [{ id: 'rd1', version: '1.0.0', createdAt: '2024-01-01T00:00:00.000Z' }],
  devBundles: [],
  manifest: { components: {} },
};

const manifest = {
  components: {
    StatusBadge: {
      displayName: 'Status Badge',
      props: [{ name: 'label', type: 'string', label: 'Label', default: 'Active' }],
      events: [],
      styles: [],
      actions: [],
    },
  },
};

// A LibraryComponent instance as a drop saves it (appCanvasUtils): which library and component it draws.
const instance = (libraryName) => ({
  id: 'statusbadge1',
  component: {
    id: 'statusbadge1',
    name: 'statusbadge1',
    component: 'LibraryComponent',
    properties: {},
    definition: {
      properties: {
        libraryId: { value: library.id },
        correlationId: { value: CORRELATION_ID },
        componentName: { value: 'StatusBadge' },
        ...(libraryName && { libraryName: { value: libraryName } }),
      },
      styles: {},
      others: libraryComponentMeta.definition.others,
    },
  },
});

// jsdom has no layout observers; the strip (ResizeObserver) and the accordions (IntersectionObserver) mount them.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || NoopObserver;
global.IntersectionObserver = global.IntersectionObserver || NoopObserver;

const renderProperties = (component) =>
  render(
    <MemoryRouter>
      <LibraryComponentProperties
        componentMeta={libraryComponentMeta}
        darkMode={false}
        layoutPropertyChanged={() => {}}
        component={component}
        paramUpdated={() => {}}
        dataQueries={[]}
        currentState={{}}
        eventsChanged={() => {}}
        apps={[]}
        allComponents={{}}
        pages={[]}
      />
    </MemoryRouter>
  );

describe('a custom library component in the Inspector', () => {
  beforeEach(() => {
    act(() => useStore.getState().setGlobalSettings({ customComponentLibraries: { [DASHLESS]: '1.0.0' } }));
    useCustomComponentLibrariesStore.setState({
      libraries: [library],
      manifests: { [`${library.id}@1.0.0`]: manifest },
    });
  });

  afterEach(() => {
    act(() => useCustomComponentLibrariesStore.setState({ libraries: null, manifests: {} }));
    act(() => useStore.getState().setGlobalSettings({ customComponentLibraries: {} }));
  });

  it('[LibraryComponent-IDENTITY-001] opens its Properties tab with the library · component strip', () => {
    // Break this catches: a custom library's instance getting no identity strip while pack components, native
    // widgets and modules all open with one.
    renderProperties(instance('Palette Tiles Demo'));

    const strip = screen.getByLabelText('Status Badge from Palette Tiles Demo');
    expect(strip.textContent).toBe('Palette Tiles Demo·Status Badge');
    // The revision the instance runs is still shown, below the strip.
    expect(screen.getByText('Revision')).toBeTruthy();
    expect(screen.getByText('1.0.0')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Component', exact: true })).toBeNull();
  });

  it('[LibraryComponent-IDENTITY-002] names the library as the workspace now calls it, else as it was when dropped', () => {
    // Break this catches: a renamed library still shown under its old name, or no strip for an instance whose
    // library list hasn't loaded.
    renderProperties(instance('Old Demo Name'));
    expect(screen.getByLabelText('Status Badge from Palette Tiles Demo')).toBeTruthy();

    act(() => useCustomComponentLibrariesStore.setState({ libraries: null }));
    expect(screen.getByLabelText('Status Badge from Old Demo Name')).toBeTruthy();
  });
});
