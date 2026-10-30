import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { useHostValidation } from '@/AppBuilder/Widgets/LibraryComponent/usePackHost';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Input } from '../../../../../../packs/shadcn/src/components/Input';

// ToolJet.useValidation({ rule }): a component's own check (a format or range message) is judged by the host with the
// Validation section, so the host alone publishes isValid. The pack used to declare its own hidden isValid prop and
// write it after the host did, which the CLI can't allow (isValid is the host's while useValidation is called).
// The pack Input, the inline SDK and the host's validation are the real ones; only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const mountInput = async (props, sectionStatus = { isValid: true }) => {
  loadLibraryModule.mockResolvedValue({ Input });
  const exposed = {};
  const setExposedVariable = (key, value) => {
    exposed[key] = value;
  };
  const latest = { current: { validate: () => sectionStatus, validation: {}, setExposedVariable } };
  const host = {
    formField: false,
    fieldId: 'rule-input',
    disabled: false,
    loading: false,
    useValidation: (value, present, rule) => useHostValidation(latest, value, present, rule),
  };
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="validation-rule-input"
      componentName="Input"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={setExposedVariable}
      fireEvent={() => {}}
      actions={new Map()}
      host={host}
      dataCy="pack-input"
    />
  );
  const root = () => view.container.querySelector('[data-cy="pack-input"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('input')).toBeTruthy());
  return { exposed, root };
};

describe("a pack component's own validation rule", () => {
  it('makes the host publish isValid false and shows the rule once the field is touched', async () => {
    // Break this catches: the host ignoring the rule, so a malformed email reads as valid to queries and Forms.
    const { exposed, root } = await mountInput({ inputType: 'email', defaultValue: 'not-an-email' });

    await waitFor(() => expect(exposed.isValid).toBe(false));
    expect(root().textContent).not.toContain('Enter a valid email address');
    fireEvent.blur(root().querySelector('input'));
    await waitFor(() => expect(root().textContent).toContain('Enter a valid email address'));
  });

  it('leaves isValid true when the rule passes and the Validation section does too', async () => {
    const { exposed } = await mountInput({ inputType: 'email', defaultValue: 'ada@example.com' });

    await waitFor(() => expect(exposed.isValid).toBe(true));
  });

  it("shows the Validation section's message when only the section fails", async () => {
    // Break this catches: an empty rule shadowing the section's own message.
    const { exposed, root } = await mountInput(
      { inputType: 'email', defaultValue: 'ada@example.com' },
      { isValid: false, validationError: 'Must be a company address' }
    );

    await waitFor(() => expect(exposed.isValid).toBe(false));
    fireEvent.blur(root().querySelector('input'));
    await waitFor(() => expect(root().textContent).toContain('Must be a company address'));
  });
});
