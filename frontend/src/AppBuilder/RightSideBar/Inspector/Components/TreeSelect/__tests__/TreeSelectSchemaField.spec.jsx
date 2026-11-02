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
import useStore from '@/AppBuilder/_stores/store';

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

function Field({ paramUpdated, saved = SAVED }) {
  const component = {
    id: 'tree1',
    component: {
      name: 'treeselect1',
      component: 'TreeSelect',
      properties: {},
      definition: { properties: { advanced: { value: '{{true}}' }, data: { value: saved } } },
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

describe('TreeSelect Schema field: bound data is saved with a warning (D-12)', () => {
  let session;
  const logs = () => session.store.read((state) => state.debugger.logs).filter((log) => log.componentId === 'tree1');

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('[TreeSelect-INSP-004] a binding to data with values equal as text is warned under the field and saved', async () => {
    // Break this catches: refusing a binding because of the data loaded now, so the save depends on whether a query ran.
    useStore.getState().setVariable('treeData', [
      { label: 'One', value: '1' },
      { label: 'Uno', value: 1 },
    ]);
    const paramUpdated = jest.fn();
    session.render(<Field paramUpdated={paramUpdated} />);
    await waitFor(() => expect(surface()).toHaveTextContent(SAVED));

    const bound = '{{variables.treeData}}';
    await replaceSchema(bound);
    await waitFor(() =>
      expect(fieldError()).toHaveTextContent(
        'Duplicate option value "1" is used by options: "One", "Uno". Option values must be unique.'
      )
    );

    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));

    await waitFor(() => expect(valueSaves(paramUpdated)).toHaveLength(1));
    expect(valueSaves(paramUpdated)[0][2]).toBe(bound);
    expect(surface()).toHaveTextContent(bound);
    expect(logs()).toEqual([]);
  });

  test('[TreeSelect-INSP-004] a binding to data with an object label is saved', async () => {
    // Break this catches: the label check refusing bound data that the canvas renders as text.
    useStore.getState().setVariable('treeData', [{ label: { x: 1 }, value: 'a' }]);
    const paramUpdated = jest.fn();
    session.render(<Field paramUpdated={paramUpdated} />);
    await waitFor(() => expect(surface()).toHaveTextContent(SAVED));

    await replaceSchema('{{variables.treeData}}');
    await waitFor(() =>
      expect(fieldError()).toHaveTextContent('Option label of "a" must be text, a number, or a boolean.')
    );
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));

    await waitFor(() => expect(valueSaves(paramUpdated)).toHaveLength(1));
    expect(valueSaves(paramUpdated)[0][2]).toBe('{{variables.treeData}}');
    expect(logs()).toEqual([]);
  });
});

describe('TreeSelect Schema field: a saved binding with bad data stays flagged (D-13)', () => {
  let session;
  const input = () => document.querySelector('.codehinter-input');

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('[TreeSelect-INSP-006] a saved binding whose data has values equal as text shows the error state without typing', async () => {
    // Break this catches: the builder losing every inspector signal once the field loses focus.
    useStore.getState().setVariable('treeData', [
      { label: 'One', value: '1' },
      { label: 'Uno', value: 1 },
    ]);
    session.render(<Field paramUpdated={jest.fn()} saved="{{variables.treeData}}" />);

    await waitFor(() => expect(input()).toHaveClass('border-danger'));
    expect(fieldError()).toBeNull();

    await userEvent.click(surface());
    expect(
      await screen.findByText(
        'Duplicate option value "1" is used by options: "One", "Uno". Option values must be unique.',
        { exact: false }
      )
    ).toBeInTheDocument();
  });

  test('[TreeSelect-INSP-006] a saved binding whose data is valid shows no error state', async () => {
    // Break this catches: flagging every binding regardless of its data.
    useStore.getState().setVariable('treeData', [
      { label: 'One', value: '1' },
      { label: 'Two', value: 2 },
    ]);
    session.render(<Field paramUpdated={jest.fn()} saved="{{variables.treeData}}" />);

    await waitFor(() => expect(surface()).toHaveTextContent('{{variables.treeData}}'));
    expect(input()).not.toHaveClass('border-danger');
  });
});
