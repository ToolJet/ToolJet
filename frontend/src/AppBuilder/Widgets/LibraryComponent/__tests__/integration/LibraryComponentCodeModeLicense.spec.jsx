import { act, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  MODULE_ID,
  store,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { dashlessId } from '@/AppBuilder/Widgets/libraryComponentRevision';

// Code mode is on every enterprise plan; custom component libraries are a plan feature of their own. A Code mode app
// is built from its own library, so it runs without the custom component license; a visual app does not.

const LIBRARY_ID = 'lib-1';
const CORRELATION_ID = '11111111-2222-3333-4444-555555555555';

// The iframe runtime renders an <iframe> as soon as the gate lets the component through.
window.localStorage.setItem('tj-cc-runtime', 'iframe');

const widget = createWidgetHarness({
  componentType: 'LibraryComponent',
  handle: 'librarycomponent1',
  id: 'lib1',
  defaultProperties: {
    libraryId: binding(LIBRARY_ID),
    correlationId: binding(CORRELATION_ID),
    libraryName: binding('My UI Library'),
    componentName: binding('Widget'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
  },
  capabilities: {
    network: [
      {
        url: 'http://localhost:3000/api/custom-component-libraries/:libraryId/revisions/:revision/files/manifest.json',
        json: { components: { Widget: { displayName: 'Widget', props: [], events: [], actions: [] } } },
      },
    ],
  },
});

const getIframe = () => document.querySelector('iframe[data-cy="librarycomponent1"]');
// LibraryComponent is lazy-loaded; its mount effect exposes setVisibility even when the gate renders nothing.
const waitForMount = () => waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function));

const givenCodeModeWithoutCustomComponents = (buildMode) =>
  act(() => {
    useStore.setState({ license: { featureAccess: { customComponentLibraries: false, codeAppsDevTrack: true } } });
    store().setApp({ ...store().appStore.modules[MODULE_ID].app, buildMode }, MODULE_ID);
  });

describe('LibraryComponent on a plan with Code mode but no custom component libraries', () => {
  beforeEach(async () => {
    await widget.setup();
    act(() => store().setGlobalSettings({ customComponentLibraries: { [dashlessId(CORRELATION_ID)]: 'v1' } }));
  });
  afterEach(() => widget.teardown());

  test('[LibraryComponent-LICENSE-007] Code mode alone does not unlock custom components in a visual app', async () => {
    // Break this catches: treating "Code mode is on" as a custom component license, which gives every enterprise
    // plan custom component libraries for free.
    givenCodeModeWithoutCustomComponents('visual');
    widget.render({ currentMode: 'view' });
    await waitForMount();

    expect(getIframe()).toBeNull();
  });

  test('[LibraryComponent-LICENSE-008] a Code mode app renders its components without the custom component license', async () => {
    // Break this catches: gating a Code mode app's own code on the custom component license, which would blank every
    // Code mode app on a plan without custom component libraries.
    givenCodeModeWithoutCustomComponents('code');
    widget.render({ currentMode: 'view' });

    await waitFor(() => expect(getIframe()).toBeInTheDocument());
  });
});
