import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A UI 2.0 options field (type optionsList) in the inspector switches between the options list and code with its fx
 * button, as other UI 2.0 fields switch between their control and code. A fixed list opens as the list; fx shows its
 * code (the literal the list wrote); fx again reads it back as the list. Options worked out by code (a query's data)
 * stay in code, and fx says why instead of switching. The code-oriented note under the field shows only in code.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { BLOCKED } from '../Components/shared/utils/optionsLiteral';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));
// The code editor itself (CodeMirror and its preview) is not what this spec is about: a text box stands in for it.
jest.mock('@uiw/react-codemirror', () => ({
  __esModule: true,
  default: ({ value }) => <textarea data-testid="code-editor" readOnly value={value ?? ''} />,
}));
jest.mock('@/AppBuilder/CodeEditor/PreviewBox', () => ({
  PreviewBox: { Container: ({ children }) => children },
}));
// react-beautiful-dnd warns about its own defaultProps under React 18; dragging is the list's own spec.
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }) => children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, {}),
}));

const ROUTER_FLAGS = { v7_startTransition: true, v7_relativeSplatPath: true };
// The code editor watches whether it is on screen; jsdom has no IntersectionObserver.
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterAll(() => {
  delete global.IntersectionObserver;
});

const field = async (type, options, { fxActive } = {}) => {
  const meta = componentTypeDefinitionMap[type];
  const seeded = componentDefinition('w1', 'w1', type, { options: { value: options, fxActive } });
  seedApp({ w1: seeded });
  const component = { id: 'w1', component: JSON.parse(JSON.stringify({ ...meta, ...seeded.component })) };
  const paramUpdated = jest.fn();
  let view;
  await act(async () => {
    view = render(
      <MemoryRouter future={ROUTER_FLAGS}>
        {renderElement(component, meta, paramUpdated, [], 'options', 'properties', {}, {}, false)}
      </MemoryRouter>
    );
  });
  return { ...view, paramUpdated };
};

const list = () => document.querySelector('[data-cy="options-options-list"]');
const codeBox = () => document.querySelector('.code-hinter-col');
const fx = () => document.querySelector('[data-cy="options-fx-button"]');
const note = () => document.querySelector('[data-cy="options-field-note"]');

describe('UI 2.0 options field', () => {
  test('a fixed list opens as the list, with no code and no code note', async () => {
    await field('ShadSelect', "{{[{ label: 'One', value: 1 }, { label: 'Two', value: 2 }]}}");
    expect(list()).not.toBeNull();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(codeBox()).toBeNull();
    expect(fx()).not.toHaveClass('active');
    expect(note()).toBeNull();
  });

  test('fx turns code on, and off again for a fixed list', async () => {
    const { paramUpdated } = await field('ShadToggleGroup', "{{['All', 'Open']}}");
    await act(async () => fireEvent.click(fx()));
    expect(paramUpdated).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'options' }),
      'fxActive',
      true,
      'properties'
    );
    expect(codeBox()).not.toBeNull();
    expect(screen.getByTestId('code-editor')).toHaveValue("{{['All', 'Open']}}");
    expect(list()).toBeNull();
    await act(async () => fireEvent.click(fx()));
    expect(paramUpdated).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'options' }),
      'fxActive',
      false,
      'properties'
    );
    expect(list()).not.toBeNull();
  });

  test('a field saved with fx on opens in code, with its note', async () => {
    await field('ShadRadioGroup', "{{['Standard', 'Premium']}}", { fxActive: true });
    expect(codeBox()).not.toBeNull();
    expect(list()).toBeNull();
    expect(fx()).toHaveClass('active');
    expect(note()).toHaveTextContent('Labels that differ from values');
  });

  test.each([
    ['ShadSelect', '{{queries.getStatuses.data}}'],
    ['ShadMultiselect', '{{components.table1.data.map((r) => ({ label: r.name, value: r.id }))}}'],
  ])('%s bound to data stays in code, and fx says why', async (type, options) => {
    const { paramUpdated } = await field(type, options);
    expect(codeBox()).not.toBeNull();
    expect(list()).toBeNull();
    expect(screen.queryByText(BLOCKED.bound)).toBeNull();
    await act(async () => fireEvent.click(fx()));
    expect(list()).toBeNull();
    expect(screen.getByText(BLOCKED.bound)).toBeInTheDocument();
    expect(paramUpdated).not.toHaveBeenCalled();
  });

  test('options that are not a list stay in code too', async () => {
    await field('ShadCombobox', 'a, b, c');
    await act(async () => fireEvent.click(fx()));
    expect(list()).toBeNull();
    expect(screen.getByText(BLOCKED.notList)).toBeInTheDocument();
  });
});
