import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

// The create dialog takes edition-specific fields under the name (the enterprise build mode choice).
jest.mock(
  '../../HomePage/Modal',
  () =>
    ({ show, title, children, footerContent }) =>
      show ? (
        <div role="dialog" aria-label={title}>
          {children}
          {footerContent}
        </div>
      ) : null
);
jest.mock('../PluginsListForAppModal', () => ({ PluginsListForAppModal: () => null }));

import { AppModal } from '../AppModal';

test('renders extraContent under the name field and still creates with the name', async () => {
  const processApp = jest.fn().mockResolvedValue(true);
  render(
    <AppModal
      show
      closeModal={() => {}}
      processApp={processApp}
      title="Create app"
      actionButton="+ Create app"
      actionLoadingButton="Creating"
      appType="front-end"
      modalType="create"
      extraContent={<div data-cy="extra-field">Build mode</div>}
    />
  );
  expect(document.querySelector('[data-cy="extra-field"]')).toHaveTextContent('Build mode');
  fireEvent.change(screen.getByPlaceholderText('Enter app name'), { target: { value: 'Visitor log' } });
  await act(async () => fireEvent.submit(document.getElementById('createAppForm')));
  expect(processApp).toHaveBeenCalledWith('Visitor log');
});

test('without extraContent the dialog is unchanged', () => {
  render(
    <AppModal
      show
      closeModal={() => {}}
      processApp={jest.fn()}
      title="Create app"
      actionButton="+ Create app"
      actionLoadingButton="Creating"
      appType="front-end"
      modalType="create"
    />
  );
  expect(document.querySelector('[data-cy="extra-field"]')).toBeNull();
  expect(screen.getByPlaceholderText('Enter app name')).toBeInTheDocument();
});
