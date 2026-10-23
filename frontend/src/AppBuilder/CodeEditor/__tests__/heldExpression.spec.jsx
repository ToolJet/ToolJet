import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A choice field holding an expression showed a stale literal: a UI 2.0 Button's Variant set to
 * {{components.slider.value > 50 ? 'destructive' : 'default'}} drew the red button, while its inspector dropdown said
 * "Default" with no fx button to see why. A field whose stored value is an expression (not a literal such as {{true}},
 * {{12}} or {{'text'}}) now shows the expression in code, even when the field is otherwise static; a literal still
 * shows its control.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Code } from '@/AppBuilder/RightSideBar/Inspector/Elements/Code';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { holdsExpression } from '../heldExpression';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/AppBuilder/RightSideBar/Inspector/Components/Table/ColumnManager/DeprecatedColumnTypeMsg', () => ({
  DeprecatedColumnTooltip: ({ children }) => children,
  checkIfTableColumnDeprecated: () => false,
}));

const field = (type, param, value, fxActive = false) =>
  render(
    // The code editor reads the route.
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Code
        param={{ name: param }}
        definition={{ value }}
        onChange={() => {}}
        paramType="properties"
        componentMeta={componentTypeDefinitionMap[type]}
        componentName="widget1"
        onFxPress={() => {}}
        fxActive={fxActive}
        component={{ id: 'w1', component: { component: type, definition: { styles: {} } } }}
      />
    </MemoryRouter>
  );
// The code box (CodeMirror) watches its visibility, which jsdom does not have.
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterAll(() => delete global.IntersectionObserver);
const inCode = (container) => !!container.querySelector('.codeShow-active');
const EXPRESSION = "{{components.slider1.value > 50 ? 'destructive' : 'default'}}";

test('literals and expressions', () => {
  [
    'default',
    '{{true}}',
    '{{ false }}',
    '{{12}}',
    '{{-0.5}}',
    "{{'text'}}",
    '{{"text"}}',
    'var(--cc-primary)',
    '',
    null,
    7,
  ].forEach((v) => expect([v, holdsExpression(v)]).toEqual([v, false]));
  [EXPRESSION, '{{variables.style}}', "{{'a' + 'b'}}", 'Hello {{name}}', '{{a}}{{b}}'].forEach((v) =>
    expect([v, holdsExpression(v)]).toEqual([v, true])
  );
});

test('a Button Variant holding an expression shows it in code, not a stale choice', () => {
  const { container } = field('ShadButton', 'variant', EXPRESSION);
  expect(inCode(container)).toBe(true);
  expect(container.querySelector('[data-cy="dropdown-variant"]')).toBeNull();
});

test('a static field (Tabs Style) holding an expression shows it in code, still without fx', () => {
  const { container } = field('ShadTabs', 'variant', "{{variables.wizard ? 'steps' : 'pills'}}");
  expect(inCode(container)).toBe(true);
  expect(container.querySelector('[data-cy="style-fx-button"]')).toBeNull();
});

test('a literal choice still shows its control', () => {
  const { container } = field('ShadButton', 'variant', 'destructive');
  expect(inCode(container)).toBe(false);
  expect(screen.getByText('Destructive')).toBeInTheDocument();
  const tabs = field('ShadTabs', 'variant', "{{'steps'}}");
  expect(inCode(tabs.container)).toBe(false);
});

test('the UI 2.0 Button Variant and Size take fx; Tabs Style stays a fixed choice', () => {
  const { properties } = componentTypeDefinitionMap.ShadButton;
  expect(properties.variant.isFxNotRequired).toBeUndefined();
  expect(properties.size.isFxNotRequired).toBeUndefined();
  expect(componentTypeDefinitionMap.ShadTabs.properties.variant.isFxNotRequired).toBe(true);
  const { container } = field('ShadButton', 'variant', 'default');
  expect(container.querySelector('[data-cy="variant-fx-button"]')).not.toBeNull();
});
