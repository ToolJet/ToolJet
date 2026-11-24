import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import DynamicFormV2 from '../DynamicFormV2';
import manifest from '../../../../marketplace/plugins/openrouter/lib/manifest.json';

jest.mock('@/AppBuilder/CodeEditor', () => ({}));
jest.mock('@/_helpers', () => ({ canUpdateDataSource: () => true, canDeleteDataSource: () => false }));
jest.mock('@/_stores/dataSourcesStore', () => ({ useGlobalDataSourcesStatus: () => ({ isEditing: true }) }));
jest.mock('@/_services', () => ({ datasourceService: { validateOptions: async () => ({ valid: true, errors: [] }) } }));

const schema = {
  type: 'object',
  properties: { customHeaders: manifest.properties.customHeaders },
  'tj:encrypted': manifest['tj:encrypted'],
  'tj:ui:properties': { customHeaders: manifest['tj:ui:properties'].customHeaders },
};
const noop = () => {};
const saved = { encrypted: true, credential_id: 'existing-credential' };

function Form({ id, initialOptions = {} }) {
  const [options, setOptions] = React.useState(initialOptions);
  return (
    <>
      <DynamicFormV2
        schema={schema}
        options={options}
        selectedDataSource={{ id, options: initialOptions }}
        optionchanged={(key, value) => setOptions({ ...options, [key]: { value } })}
        optionsChanged={setOptions}
        validationMessages={{}}
        clearValidationMessages={noop}
        setValidationMessages={noop}
        clearValidationErrorBanner={noop}
      />
      <button onClick={() => setOptions(initialOptions)}>Reload saved settings</button>
      <output data-testid="options">{JSON.stringify(options)}</output>
    </>
  );
}

const headerOption = () => JSON.parse(screen.getByTestId('options').textContent).customHeaders;

test.each([undefined, 'legacy-datasource'])(
  'edits optional literal header pairs without a saved credential (%s)',
  (id) => {
    render(<Form id={id} />);
    expect(headerOption()).toBeUndefined();
    expect(screen.queryByPlaceholderText('Key')).toBeNull();
    expect(screen.queryByPlaceholderText('Value')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.change(screen.getByPlaceholderText('Key'), { target: { value: 'X-Inventory-Key' } });
    const value = screen.getAllByPlaceholderText('Value')[0];
    expect(value).toHaveAttribute('type', 'password');
    expect(value).toHaveAttribute('autocomplete', 'new-password');
    fireEvent.change(value, { target: { value: '{{secrets.literal-token}}' } });
    expect(value).toHaveAttribute('type', 'password');
    expect(JSON.parse(headerOption().value)).toContainEqual(['X-Inventory-Key', '{{secrets.literal-token}}']);
    expect(headerOption().value).not.toContain('{{secrets');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.change(screen.getAllByPlaceholderText('Key')[1], { target: { value: 'X-Theme' } });
    fireEvent.change(screen.getAllByPlaceholderText('Value')[1], { target: { value: 'maroon' } });
    expect(JSON.parse(headerOption().value)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Remove row 1' }));
    expect(JSON.parse(headerOption().value)).toEqual([['X-Theme', 'maroon']]);
  }
);

test('keeps saved headers opaque until replaced, supports cancellation and explicitly clearing them', () => {
  render(<Form id="configured-datasource" initialOptions={{ customHeaders: saved }} />);
  expect(screen.queryByPlaceholderText('Value')).toBeNull();
  expect(headerOption()).toEqual(saved);
  fireEvent.click(screen.getByRole('button', { name: 'Set headers' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  fireEvent.change(screen.getByPlaceholderText('Key'), { target: { value: 'X-Color' } });
  fireEvent.change(screen.getAllByPlaceholderText('Value')[0], { target: { value: 'blue' } });
  expect(JSON.parse(headerOption().value)).toContainEqual(['X-Color', 'blue']);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(headerOption()).toEqual(saved);
  expect(screen.queryByPlaceholderText('Value')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Set headers' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear headers' }));
  expect(headerOption().value).toBe('[]');
});

test('locks the header editor again when saved settings reload', () => {
  render(<Form id="saved-datasource" initialOptions={{ customHeaders: saved }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Set headers' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reload saved settings' }));
  expect(screen.queryByPlaceholderText('Value')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Set headers' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  expect(screen.getByPlaceholderText('Value')).toHaveValue('');
});

test.each(['invalid-json', '{}', '[null]'])('allows replacing a malformed header draft', (value) => {
  render(<Form id="invalid-draft" initialOptions={{ customHeaders: { value } }} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Enter the headers again');
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Header name 1' }), { target: { value: 'X-Tint' } });
  expect(JSON.parse(headerOption().value)).toEqual([['X-Tint', '']]);
});
