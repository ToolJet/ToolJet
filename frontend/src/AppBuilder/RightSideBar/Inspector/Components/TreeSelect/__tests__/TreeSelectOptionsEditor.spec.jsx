/**
 * TreeSelect static options editor: the contract in
 * frontend/ee/test/app-builder/widgets/TreeSelect/TESTING.md (D-11), exercised through the real
 * options list, item popover, code editors, hook and store. `paramUpdated` is the inspector's
 * save callback, the boundary this editor writes through.
 */
import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import TreeSelectOptionsList from '../components/TreeSelectOptionsList';
import { useTreeSelectItemsManager } from '../hooks/useTreeSelectItemsManager';

const scenario = defineAppBuilderScenario({
  id: 'treeselect-options-editor',
  name: 'TreeSelect static options editor',
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

const option = (label, value) => ({ label, value, visible: { value: true }, disable: { value: false } });

function Editor({ options, paramUpdated }) {
  const component = {
    id: 'tree1',
    component: { name: 'treeselect1', definition: { properties: { options: { value: options } } } },
  };
  const manager = useTreeSelectItemsManager(component, paramUpdated);
  return (
    <TreeSelectOptionsList
      treeItems={manager.treeItems}
      darkMode={false}
      onDeleteItem={manager.handleDeleteItem}
      onItemChange={manager.handleItemChange}
      validateItemField={manager.validateItemField}
      onAddItem={manager.handleAddItem}
      onAddNestedItem={manager.handleAddNestedItem}
      onReorder={manager.handleReorder}
      getResolvedValue={manager.getResolvedValue}
    />
  );
}

const field = (name) => document.querySelector(`[data-cy="inspector-treeselect-item-details-${name}-field"]`);
const editorText = (name) => field(name).querySelector('.cm-content').textContent;
const popoverTitle = () => screen.getByText('Edit option');

async function retype(name, text) {
  const surface = field(name).querySelector('.cm-content');
  await userEvent.click(surface);
  await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
  await userEvent.type(surface, text);
}

describe('TreeSelect options editor: bad values are refused', () => {
  let session;
  const logs = () => session.store.read((state) => state.debugger.logs).filter((log) => log.componentId === 'tree1');

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('[TreeSelect-INSP-001] a value equal as text to another option is flagged while typing and refused on blur', async () => {
    // Break this catches: saving a value the tree library treats as a duplicate, which crashes the widget.
    const paramUpdated = jest.fn();
    session.render(<Editor options={[option('One', '{{1}}'), option('Two', '2')]} paramUpdated={paramUpdated} />);

    await userEvent.click(await screen.findByText('Two'));
    await retype('value', '1');

    const message = within(field('value')).getByText(/Option value must be unique\./);
    expect(message).toHaveTextContent('Option value must be unique. Also used by: "One"');

    await userEvent.click(popoverTitle());

    await waitFor(() => expect(editorText('value')).toBe('2'));
    expect(paramUpdated).not.toHaveBeenCalled();
    expect(logs()).toEqual([
      expect.objectContaining({
        key: 'treeselect1 - Option value',
        logLevel: 'error',
        message: 'Duplicate option value "1" is used by options: "Two", "One". Option values must be unique.',
      }),
    ]);
    expect(within(field('value')).queryByText(/Option value must be unique\./)).not.toBeInTheDocument();
  });

  test('[TreeSelect-INSP-001] a value that worked before is still saved without a message', async () => {
    // Break this catches: refusing inputs that rendered before (an empty value), which would break saved apps.
    const paramUpdated = jest.fn();
    session.render(<Editor options={[option('One', '1'), option('Two', '2')]} paramUpdated={paramUpdated} />);

    await userEvent.click(await screen.findByText('Two'));
    await retype('value', '3');
    expect(within(field('value')).queryByText(/must be unique/)).not.toBeInTheDocument();
    await userEvent.click(popoverTitle());

    await waitFor(() => expect(paramUpdated).toHaveBeenCalledTimes(1));
    expect(paramUpdated.mock.calls[0][2].map((o) => o.value)).toEqual(['1', '3']);
    expect(logs()).toEqual([]);
  });

  test('[TreeSelect-INSP-002] a label that resolves to an object is flagged and refused on blur', async () => {
    // Break this catches: saving a label React cannot render.
    const paramUpdated = jest.fn();
    session.render(<Editor options={[option('One', '1'), option('Two', '2')]} paramUpdated={paramUpdated} />);

    await userEvent.click(await screen.findByText('Two'));
    await retype('label', '{{{{ {{x: 1}');
    expect(editorText('label')).toBe('{{ {x: 1}}}');

    expect(within(field('label')).getByText('Option label must be text, a number, or a boolean.')).toBeInTheDocument();
    await userEvent.click(popoverTitle());

    await waitFor(() => expect(editorText('label')).toBe('Two'));
    expect(paramUpdated).not.toHaveBeenCalled();
    expect(logs()).toEqual([
      expect.objectContaining({
        key: 'treeselect1 - Option label',
        logLevel: 'error',
        message: 'Option label of "2" must be text, a number, or a boolean.',
      }),
    ]);
  });

  test('[TreeSelect-INSP-002] a saved object label shows as text in the options list instead of crashing it', async () => {
    // Break this catches: rendering a saved object label straight into the inspector list.
    session.render(<Editor options={[option('{{ {x: 1} }}', 'obj'), option('Two', '2')]} paramUpdated={jest.fn()} />);

    expect(await screen.findByText('Two')).toBeInTheDocument();
    expect(screen.getByText('[object Object]')).toBeInTheDocument();
  });
});
