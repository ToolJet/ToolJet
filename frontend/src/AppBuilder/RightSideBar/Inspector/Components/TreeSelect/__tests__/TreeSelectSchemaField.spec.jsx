/**
 * TreeSelect Schema field (Dynamic options on): the contract in
 * frontend/ee/test/app-builder/widgets/TreeSelect/TESTING.md (D-11), exercised through the real
 * Code field, code editor and store. `paramUpdated` is the inspector's save callback.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { TreeSelectSchemaField } from '../components/TreeSelectSchemaField';

const scenario = defineAppBuilderScenario({
  id: 'treeselect-schema-field',
  name: 'TreeSelect Schema field',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, geometry: { textRange: true }, media: { matches: false } },
});

const SAVED = "{{[{ label: 'One', value: '1' }, { label: 'Two', value: 2 }]}}";

function Field({ paramUpdated }) {
  const component = {
    id: 'tree1',
    component: {
      name: 'treeselect1',
      component: 'TreeSelect',
      properties: {},
      definition: { properties: { advanced: { value: '{{true}}' }, data: { value: SAVED } } },
    },
  };
  return (
    <>
      <TreeSelectSchemaField
        component={component}
        componentMeta={componentTypeDefinitionMap.TreeSelect}
        paramUpdated={paramUpdated}
        dataQueries={[]}
        darkMode={false}
      />
      <button type="button">elsewhere</button>
    </>
  );
}

const surface = () => document.querySelector('.cm-content');
const fieldError = () => document.querySelector('[data-cy="inspector-treeselect-schema-error"]');
const valueSaves = (paramUpdated) => paramUpdated.mock.calls.filter((call) => call[1] === 'value');

async function replaceSchema(text) {
  await userEvent.click(surface());
  await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
  await userEvent.paste(text);
}

describe('TreeSelect Schema field: data that crashed the widget is refused', () => {
  let session;
  const logs = () => session.store.read((state) => state.debugger.logs).filter((log) => log.componentId === 'tree1');

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('[TreeSelect-INSP-003] values equal as text are flagged under the field, refused on blur and logged', async () => {
    // Break this catches: saving data the tree library sees as duplicates, which used to crash the widget.
    const paramUpdated = jest.fn();
    session.render(<Field paramUpdated={paramUpdated} />);
    await waitFor(() => expect(surface()).toHaveTextContent(SAVED));

    const bad = "{{[{ label: 'One', value: '1' }, { label: 'Uno', value: 1 }]}}";
    await replaceSchema(bad);
    expect(surface()).toHaveTextContent(bad);
    await waitFor(() =>
      expect(fieldError()).toHaveTextContent(
        'Duplicate option value "1" is used by options: "One", "Uno". Option values must be unique.'
      )
    );

    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));

    await waitFor(() => expect(surface()).toHaveTextContent(SAVED));
    expect(valueSaves(paramUpdated)).toEqual([]);
    expect(fieldError()).toBeNull();
    expect(logs()).toEqual([
      expect.objectContaining({
        key: 'treeselect1 - Schema',
        logLevel: 'error',
        message: 'Duplicate option value "1" is used by options: "One", "Uno". Option values must be unique.',
      }),
    ]);
  });

  test('[TreeSelect-INSP-003] an object label is flagged, refused on blur and logged', async () => {
    // Break this catches: saving a label React cannot render.
    const paramUpdated = jest.fn();
    session.render(<Field paramUpdated={paramUpdated} />);
    await waitFor(() => expect(surface()).toHaveTextContent(SAVED));

    await replaceSchema("{{[{ label: { x: 1 }, value: 'a' }]}}");
    await waitFor(() =>
      expect(fieldError()).toHaveTextContent('Option label of "a" must be text, a number, or a boolean.')
    );
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));

    await waitFor(() => expect(surface()).toHaveTextContent(SAVED));
    expect(valueSaves(paramUpdated)).toEqual([]);
    expect(logs()).toHaveLength(1);
  });

  test('[TreeSelect-INSP-003] data that rendered before is saved with no message', async () => {
    // Break this catches: refusing data that worked before, which would break saved apps.
    const paramUpdated = jest.fn();
    session.render(<Field paramUpdated={paramUpdated} />);
    await waitFor(() => expect(surface()).toHaveTextContent(SAVED));

    const good =
      "{{[{ label: 'One', value: 1 }, { label: '', value: '' }, { label: 5, value: null }, { label: 'Hidden', value: 1, visible: false }]}}";
    await replaceSchema(good);
    expect(fieldError()).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));

    await waitFor(() => expect(valueSaves(paramUpdated)).toHaveLength(1));
    expect(valueSaves(paramUpdated)[0][2]).toBe(good);
    expect(logs()).toEqual([]);
  });
});
