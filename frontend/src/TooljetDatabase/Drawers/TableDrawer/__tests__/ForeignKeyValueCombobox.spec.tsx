// The picker for a column that has a relation: the choices are the values of the referenced column, searched on the
// server, with NULL on top when the column may be left unset.
import '@/test/setupMsw';
import React, { useState } from 'react';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { act, fireEvent } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { render, screen, waitFor } from '@/test/test-utils';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { ForeignKeyValueCombobox } from '../ForeignKeyValueCombobox';

function serve(requests: URLSearchParams[] = []) {
  server.use(
    http.get('*/tooljet-db/proxy/:tableId', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const rows = ['acme', 'globex', 'initech'].map((name) => ({ name }));
      return HttpResponse.json(rows, { headers: { 'content-range': '0-2/3' } });
    })
  );
}

function Harness({ allowNull = false, onChange }: { allowNull?: boolean; onChange: (value: string | null) => void }) {
  const [value, setValue] = useState<string | null>(allowNull ? null : '');
  return (
    <ForeignKeyValueCombobox
      tableId="customers"
      tableName="customers"
      column="name"
      isTextColumn
      value={value}
      allowNull={allowNull}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('ForeignKeyValueCombobox', () => {
  beforeEach(() => {
    act(() =>
      useTjdbStore.setState({ selectedEnvironment: { id: 'env-development', name: 'development', priority: 1 } })
    );
  });

  test('should offer the values of the referenced column and report the one picked', async () => {
    serve();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'globex' }));

    expect(onChange).toHaveBeenCalledWith('globex');
  });

  test('should search the referenced column on the server as the user types', async () => {
    const requests: URLSearchParams[] = [];
    serve(requests);
    render(<Harness onChange={() => {}} />);

    await userEvent.type(screen.getByRole('combobox'), 'glo');

    await waitFor(() => expect(requests.some((params) => params.getAll('name').includes('ilike.%glo%'))).toBe(true));
  });

  test('should offer NULL first when the column may be unset', async () => {
    serve();
    const onChange = jest.fn();
    render(<Harness allowNull onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'globex' }));
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'NULL' }));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  test('should load the next 50 values when the list is scrolled to its end', async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get('*/tooljet-db/proxy/:tableId', ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        const offset = Number(params.get('offset') ?? 0);
        const count = Math.max(0, Math.min(50, 80 - offset));
        return HttpResponse.json(Array.from({ length: count }, (_, index) => ({ name: `c${offset + index + 1}` })));
      })
    );
    render(<Harness onChange={() => {}} />);

    await userEvent.click(screen.getByRole('combobox'));
    const list = await screen.findByRole('listbox');
    await screen.findByRole('option', { name: 'c50' });
    expect(requests).toHaveLength(1);

    // jsdom has no layout: say the list is scrolled to its end.
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 790 });
    fireEvent.scroll(list);

    await screen.findByRole('option', { name: 'c80' });
    expect(requests[1].get('offset')).toBe('50');
  });

  test('should not ask for more while the list is far from its end', async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get('*/tooljet-db/proxy/:tableId', ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return HttpResponse.json(Array.from({ length: 50 }, (_, index) => ({ name: `c${index + 1}` })));
      })
    );
    render(<Harness onChange={() => {}} />);

    await userEvent.click(screen.getByRole('combobox'));
    const list = await screen.findByRole('listbox');
    await screen.findByRole('option', { name: 'c50' });

    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 100 });
    fireEvent.scroll(list);

    expect(requests).toHaveLength(1);
  });
});
