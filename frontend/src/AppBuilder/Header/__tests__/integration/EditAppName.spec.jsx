/**
 * Inline app rename in the editor header. After a "name already exists" error the user fixes the name
 * in place, so the input must keep keyboard focus through the save (HP-10b).
 */
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { act, screen, waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import EditAppName from '@/AppBuilder/Header/EditAppName';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render, userEvent } from '@/test/test-utils';

const API = 'http://localhost:3000/api';
const controls = createAppBuilderControls();

afterEach(() => controls.restore());

beforeEach(() => {
  controls.observers.install();
  act(() => useStore.getState().setApp({ appId: 'app-1', appName: 'Orders', slug: 'orders' }, 'canvas'));
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <EditAppName />
    </ModuleProvider>
  );
});

test('keeps focus in the name input after a duplicate-name error so the user can fix it', async () => {
  server.use(
    http.put(`${API}/apps/app-1`, () => HttpResponse.json({ message: 'App name already exists' }, { status: 409 }))
  );
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: /Orders/ }));
  const input = screen.getByRole('textbox', { name: 'App name' });
  await user.clear(input);
  await user.type(input, 'Invoices{Enter}');

  expect(await screen.findByText('App name already exists')).toBeInTheDocument();
  expect(input).toHaveFocus();

  await user.type(input, '2');
  expect(input).toHaveValue('Invoices2');
});

// Browsers move focus to <body> when a focused input becomes disabled (jsdom doesn't), so while the
// request is in flight the input is made read-only instead of disabled.
test('keeps the input enabled and read-only while the rename is saving', async () => {
  let release;
  server.use(
    http.put(`${API}/apps/app-1`, async () => {
      await new Promise((resolve) => (release = resolve));
      return HttpResponse.json({ message: 'App name already exists' }, { status: 409 });
    })
  );
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: /Orders/ }));
  const input = screen.getByRole('textbox', { name: 'App name' });
  await user.clear(input);
  await user.type(input, 'Invoices{Enter}');

  await waitFor(() => expect(input).toHaveAttribute('readonly'));
  expect(input).not.toBeDisabled();

  await act(async () => release());
  await screen.findByText('App name already exists');
  expect(input).not.toHaveAttribute('readonly');
});

test('saves a new name and leaves edit mode', async () => {
  server.use(http.put(`${API}/apps/app-1`, () => HttpResponse.json({})));
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: /Orders/ }));
  const input = screen.getByRole('textbox', { name: 'App name' });
  await user.clear(input);
  await user.type(input, 'Invoices{Enter}');

  await waitFor(() => expect(useStore.getState().appStore.modules.canvas.app.appName).toBe('Invoices'));
  await waitFor(() => expect(screen.queryByRole('textbox', { name: 'App name' })).not.toBeInTheDocument());
});
