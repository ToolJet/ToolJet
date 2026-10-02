import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import DynamicForm from '../DynamicForm';

// Only DynamicForm's layout logic is under test; stub the heavy field editors it renders.
jest.mock('@/AppBuilder/CodeEditor', () => {
  const CodeHinterStub = () => <div data-testid="codehinter" />;
  return { __esModule: true, default: CodeHinterStub };
});
jest.mock('@/_ui/Select', () => {
  const SelectStub = () => <div data-testid="select" />;
  return { __esModule: true, default: SelectStub };
});

// Mirrors the shape of plugins/packages/woocommerce/lib/operations.json: the `list_product`
// operation has a field whose key is literally `type` (the WooCommerce product type filter).
const schema = {
  type: 'api',
  defaults: {},
  properties: {
    resource: {
      label: 'Resource',
      key: 'resource',
      type: 'dropdown-component-flip',
      list: [
        { value: 'customer', name: 'Customer' },
        { value: 'product', name: 'Product' },
      ],
    },
    customer: {
      operation: {
        label: 'Operation',
        key: 'operation',
        type: 'dropdown-component-flip',
        list: [{ value: 'list_customer', name: 'List all customers' }],
      },
      list_customer: {
        email: { label: 'Email', key: 'email', type: 'codehinter' },
      },
    },
    product: {
      operation: {
        label: 'Operation',
        key: 'operation',
        type: 'dropdown-component-flip',
        list: [{ value: 'list_product', name: 'List all products' }],
      },
      list_product: {
        sku: { label: 'SKU', key: 'sku', type: 'codehinter' },
        type: { label: 'Type', key: 'type', type: 'codehinter' },
      },
    },
  },
};

const renderForm = (options) =>
  render(<DynamicForm schema={schema} options={options} optionsChanged={jest.fn()} isEditMode />);

describe('DynamicForm', () => {
  it('renders an operation group that contains a field keyed `type` without crashing', () => {
    renderForm({ resource: { value: 'product' } });

    expect(screen.getByText('Operation')).toBeInTheDocument();
    // Operation fields must only render once that operation is selected
    expect(screen.queryByText('SKU')).not.toBeInTheDocument();
  });

  it('renders the fields of the selected operation, including the field keyed `type`', () => {
    renderForm({ resource: { value: 'product' }, operation: { value: 'list_product' } });

    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('still renders resources without a field keyed `type`', () => {
    renderForm({ resource: { value: 'customer' }, operation: { value: 'list_customer' } });

    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});
