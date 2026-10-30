/**
 * A choice field holding an expression showed a stale literal: a Chart's Type set to
 * {{components.slider1.value > 50 ? 'bar' : 'line'}} drew a bar chart, while its inspector dropdown said "Line" with
 * no fx button to see why (an AI build or an import can store an expression in a field whose fx is off). A field whose stored value is an expression (not a literal such as {{true}},
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
const EXPRESSION = "{{components.slider1.value > 50 ? 'bar' : 'line'}}";

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

test('a Chart Type holding an expression shows it in code, not a stale choice', () => {
  const { container } = field('Chart', 'type', EXPRESSION);
  expect(inCode(container)).toBe(true);
  expect(container.querySelector('[data-cy^="dropdown-"]')).toBeNull();
});

test('a static field (Text Format) holding an expression shows it in code, still without fx', () => {
  const { container } = field('Text', 'textFormat', "{{variables.rich ? 'markdown' : 'plainText'}}");
  expect(inCode(container)).toBe(true);
  expect(container.querySelector('[data-cy$="-fx-button"]')).toBeNull();
});

test('a literal choice still shows its control', () => {
  const { container } = field('Chart', 'type', 'bar');
  expect(inCode(container)).toBe(false);
  const text = field('Text', 'textFormat', "{{'markdown'}}");
  expect(inCode(text.container)).toBe(false);
});
