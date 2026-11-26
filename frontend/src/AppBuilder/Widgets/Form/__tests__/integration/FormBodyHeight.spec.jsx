/**
 * Form — the body fills the space between the header and the footer.
 *
 * With dynamic height on, a child that grows (a Textarea being typed into) makes the Form's box taller.
 * The body has to take that extra height. A body fixed at the saved size kept its height, so the child
 * was cut off, the body scrolled, and the extra height showed up as empty space below the footer.
 *
 * jsdom does no layout, so this checks the body's own height style: `100%` follows the Form's box, a
 * pixel value does not. The growth itself is checked in a browser.
 *
 * Form has no TESTING.md contract yet (widget-testing-manifest: not-started); this is a focused
 * regression test, not a contract scenario.
 */
import React from 'react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const FORM_SCENARIO = defineAppBuilderScenario({
  id: 'form-body-height',
  name: 'Form body height',
  primarySeam: 'rtl',
  surface: 'authenticated-preview',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // dnd: the Form body renders through AppCanvas/Container, which needs the real provider.
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

const state = () => useStore.getState();

/** A Form saved 450px tall with an 80px header and footer, rendered in preview. */
async function renderForm(session, { dynamicHeight }) {
  const form = componentDefinition('form1', 'form1', 'Form', {
    advanced: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showHeader: binding('{{true}}'),
    showFooter: binding('{{true}}'),
    headerHeight: binding(80),
    footerHeight: binding(80),
    dynamicHeight: binding(`{{${dynamicHeight}}}`),
  });
  seedApp({ form1: form }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  // RenderWidget hands the widget `widgetHeight - 4`, so the Form's saved height is 450.
  session.render(<RenderWidget {...widgetProps('form1', 'Form', { currentMode: 'view', widgetHeight: 454 })} />);
  await drain();
  // The body section's data-cy is `<form data-cy>-body-section` (Form.jsx).
  return document.querySelector('[data-cy$="-body-section"]');
}

describe('Form body height', () => {
  let session;
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: FORM_SCENARIO });
  });

  // Break this catches: the body sized to a fixed pixel height worked out from the saved Form height. When a
  // child grows, the Form's box grows but the body does not: the child is cut off and the space goes below the footer.
  test('with dynamic height on, the body follows the height of the Form', async () => {
    const body = await renderForm(session, { dynamicHeight: true });

    expect(body).not.toBeNull();
    expect(body.style.height).toBe('100%');
  });

  // Break this catches: the same fixed pixel body brought back for a Form without dynamic height. The body has
  // filled the Form in every release before 2026-10-06 and still does on lts-3.16.
  test('with dynamic height off, the body still fills the Form between header and footer', async () => {
    const body = await renderForm(session, { dynamicHeight: false });

    expect(body).not.toBeNull();
    expect(body.style.height).toBe('100%');
  });
});
