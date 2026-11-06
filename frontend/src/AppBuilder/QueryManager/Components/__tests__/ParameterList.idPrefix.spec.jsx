import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import ParameterList from '../ParameterList';

// External icon package adapter: the shared lucide stub in __mocks__ can't render icons from this lucide version.
jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));
// The popover form embeds a code editor, which needs a browser.
jest.mock('@/AppBuilder/CodeEditor', () => ({ __esModule: true, default: () => null }));

const list = (props) => (
  <ParameterList
    parameters={[{ name: 'limit' }]}
    handleAddParameter={() => {}}
    handleParameterChange={() => {}}
    handleParameterRemove={() => {}}
    containerRef={{ current: { offsetWidth: 800 } }}
    {...props}
  />
);

describe('ParameterList idPrefix', () => {
  it('keeps the ids and data-cy values of a normal parameter list unchanged', () => {
    const { container } = render(list());

    expect(container.querySelector('#runjs-param-add-btn')).toHaveAttribute('data-cy', 'query-param-add-button');
    expect(container.querySelector('#query-param-limit')).toBeInTheDocument();
    expect(container.querySelector('[data-cy="query-param-limit"]')).toBeInTheDocument();
  });

  it('gives a prefixed list its own ids, so two lists never share an anchor', () => {
    const { container } = render(
      <>
        {list({ label: 'Inputs', idPrefix: 'inputs-', noun: 'input' })}
        {list()}
      </>
    );

    expect(container.querySelectorAll('#runjs-param-add-btn')).toHaveLength(1);
    expect(container.querySelectorAll('#inputs-runjs-param-add-btn')).toHaveLength(1);
    expect(container.querySelectorAll('#query-param-limit')).toHaveLength(1);
    expect(container.querySelectorAll('#inputs-query-param-limit')).toHaveLength(1);
  });

  it('titles the add popover after the noun, "ADD PARAMETER" by default', async () => {
    render(list({ idPrefix: 'inputs-', noun: 'input' }));
    await userEvent.click(document.getElementById('inputs-runjs-param-add-btn'));
    expect(await screen.findByText('ADD INPUT')).toBeInTheDocument();
  });

  it('keeps "ADD PARAMETER" for a normal list', async () => {
    render(list());
    await userEvent.click(document.getElementById('runjs-param-add-btn'));
    expect(await screen.findByText('ADD PARAMETER')).toBeInTheDocument();
  });
});
