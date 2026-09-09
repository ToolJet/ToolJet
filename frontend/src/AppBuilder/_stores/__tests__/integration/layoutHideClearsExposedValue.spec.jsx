/**
 * Bug: a widget hidden by a layout switch (`others.showOnMobile`/`showOnDesktop`
 * false for the incoming `currentLayout`) is really unmounted by WidgetWrapper
 * (AppCanvas/WidgetWrapper.jsx), but nothing clears its entry out of the
 * exposed-values store. A widget that only computes its real default value in
 * a mount-only effect (e.g. RadioButtonV2's `value`) leaves that stale value
 * behind after it is hidden, even though the widget no longer exists on the
 * canvas.
 *
 * This matters because a module edited desktop-first always gets that one
 * "warm" mount before ever being hidden, so the stale value survives and
 * looks correct. A module consumed inside an app that loads straight into
 * mobile view never gets that warm mount, so the same widget's value is
 * simply never computed — the two surfaces disagree on the same widget.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import WidgetWrapper from '@/AppBuilder/AppCanvas/WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';

const MODULE_ID = 'canvas';

const scenario = defineAppBuilderScenario({
  id: 'layout-hide-clears-exposed-value',
  name: 'Layout hide clears stale exposed value',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false } },
});

// RadioButtonV2's own shipped default (radiobuttonv2.js): option "2" selected,
// hidden on mobile out of the box.
const RADIO_OPTIONS = {
  value: [
    { label: 'option1', value: '1', disable: { value: false }, visible: { value: true }, default: { value: false } },
    { label: 'option2', value: '2', disable: { value: false }, visible: { value: true }, default: { value: true } },
    { label: 'option3', value: '3', disable: { value: false }, visible: { value: true }, default: { value: false } },
  ],
};

function seedHiddenOnMobileRadio(id) {
  const definition = componentDefinition(id, 'radio1', 'RadioButtonV2', { options: RADIO_OPTIONS });
  definition.component.definition.others = {
    showOnDesktop: { value: '{{true}}' },
    showOnMobile: { value: '{{false}}' },
  };
  definition.layouts = {
    desktop: { top: 0, left: 0, width: 8, height: 40 },
    mobile: { top: 0, left: 0, width: 8, height: 40 },
  };
  seedApp({ [id]: definition }, { moduleId: MODULE_ID });
}

function widgetWrapperProps(id, currentLayout) {
  return {
    id,
    moduleId: MODULE_ID,
    mode: 'edit',
    currentLayout,
    gridWidth: 200,
    inCanvas: true,
    onOptionChange: () => {},
    onOptionsChange: () => {},
  };
}

describe('a widget hidden by a layout switch', () => {
  let session;
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('clears its stale exposed value instead of keeping the value computed before the switch', async () => {
    seedHiddenOnMobileRadio('radio1');
    const state = useStore.getState();
    state.setEditorLoading(false, MODULE_ID);
    state.setCurrentMode('edit', MODULE_ID);

    session.render(<WidgetWrapper {...widgetWrapperProps('radio1', 'desktop')} />);

    await waitFor(() => expect(document.getElementById('radio1')).toBeInTheDocument());
    expect(useStore.getState().getExposedValueOfComponent('radio1').value).toBe('2');

    await session.store.act('setCurrentLayout', 'mobile');
    session.render(<WidgetWrapper {...widgetWrapperProps('radio1', 'mobile')} />);

    await waitFor(() => expect(document.getElementById('radio1')).not.toBeInTheDocument());

    // Break this catches: layoutSlice.setCurrentLayout not clearing a
    // now-hidden component's exposed value when the widget unmounts.
    expect(useStore.getState().getExposedValueOfComponent('radio1').value).toBeUndefined();
  });

  test('recomputes correctly after switching back to a layout where it is shown again', async () => {
    seedHiddenOnMobileRadio('radio1');
    const state = useStore.getState();
    state.setEditorLoading(false, MODULE_ID);
    state.setCurrentMode('edit', MODULE_ID);

    session.render(<WidgetWrapper {...widgetWrapperProps('radio1', 'desktop')} />);
    await waitFor(() => expect(document.getElementById('radio1')).toBeInTheDocument());

    await session.store.act('setCurrentLayout', 'mobile');
    session.render(<WidgetWrapper {...widgetWrapperProps('radio1', 'mobile')} />);
    await waitFor(() => expect(document.getElementById('radio1')).not.toBeInTheDocument());

    await session.store.act('setCurrentLayout', 'desktop');
    session.render(<WidgetWrapper {...widgetWrapperProps('radio1', 'desktop')} />);

    // Break this catches: clearing the exposed value on hide leaving nothing
    // behind for the widget to recompute from once it remounts.
    await waitFor(() => expect(document.getElementById('radio1')).toBeInTheDocument());
    expect(useStore.getState().getExposedValueOfComponent('radio1').value).toBe('2');
  });
});
