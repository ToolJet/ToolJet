/**
 * RunJS and RunPython label their code box "Code", in the same style as the "Parameters" label above it.
 * The label row sits first, above the code box.
 */
import React from 'react';
import { screen } from '@testing-library/react';
import Runjs from '@/AppBuilder/QueryManager/QueryEditors/Runjs/Runjs';
import { Runpy } from '@/AppBuilder/QueryManager/QueryEditors/Runpy';
import { QUERY_FIELD_LABEL_CLASS_NAME } from '@/AppBuilder/panelLayout';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();

beforeEach(() => controls.observers.install());
afterEach(() => controls.restore());

test.each([
  ['RunJS', Runjs, 'runjs-editor'],
  ['RunPython', Runpy, 'runps-editor'],
])('%s shows a Code label above the code box', (_, Editor, editorClassName) => {
  const { container } = render(<Editor options={{ code: 'return 1' }} optionsChanged={() => {}} />);

  const label = screen.getByText('Code');
  expect(label).toHaveAttribute('data-cy', 'query-code-label');
  expect(label).toHaveClass(QUERY_FIELD_LABEL_CLASS_NAME);

  const editor = container.querySelector(`.${editorClassName}`);
  expect(editor.firstElementChild).toContainElement(label);
});
