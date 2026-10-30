/**
 * RunJS and RunPython open their code in a new browser tab (header button), so their code box drops
 * the older "pop out code editor" popup. Other multi-line code boxes keep it.
 */
import React from 'react';
import Runjs from '@/AppBuilder/QueryManager/QueryEditors/Runjs/Runjs';
import { Runpy } from '@/AppBuilder/QueryManager/QueryEditors/Runpy';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const popupIcon = (container) => container.querySelector('.codehinter-popup-icon');

beforeEach(() => controls.observers.install());
afterEach(() => controls.restore());

test.each([
  ['RunJS', Runjs],
  ['RunPython', Runpy],
])('%s code box has no popup editor', (_, Editor) => {
  const { container } = render(<Editor options={{ code: 'return 1' }} optionsChanged={() => {}} />);

  expect(container.querySelector('.cm-editor')).toBeInTheDocument();
  expect(popupIcon(container)).toBeNull();
});

test('other multi-line code boxes keep the popup editor', () => {
  const { container } = render(
    <CodeHinter type="multiline" initialValue="{{1}}" lang="javascript" componentName="transformation" />
  );

  expect(popupIcon(container)).toBeInTheDocument();
});
