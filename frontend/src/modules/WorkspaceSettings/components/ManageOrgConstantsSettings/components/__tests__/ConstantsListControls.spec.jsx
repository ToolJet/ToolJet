import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConstantsListControls from '../ConstantsListControls';

const ENVIRONMENTS = [
  { id: 'env-dev', name: 'Development' },
  { id: 'env-prod', name: 'Production' },
];

const setup = (props = {}) => {
  const handlers = { onEnvChange: jest.fn(), onSortChange: jest.fn(), onSourceChange: jest.fn() };
  render(
    <ConstantsListControls
      showEnv
      environments={ENVIRONMENTS}
      environmentId="env-prod"
      sort="name_asc"
      source={['workspace', 'env']}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

const open = (name) => userEvent.click(screen.getByRole('button', { name }));

describe('ConstantsListControls', () => {
  describe('environment select', () => {
    it('shows the current environment as the button label', () => {
      setup();
      expect(screen.getByRole('button', { name: 'Environment' })).toHaveTextContent('Production');
    });

    it('lists every environment and marks the current one', async () => {
      setup();
      await open('Environment');
      expect(await screen.findByRole('menuitemradio', { name: 'Production' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('menuitemradio', { name: 'Development' })).toHaveAttribute('aria-checked', 'false');
    });

    it('reports the chosen environment id', async () => {
      const { onEnvChange } = setup();
      await open('Environment');
      await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Development' }));
      expect(onEnvChange).toHaveBeenCalledWith('env-dev');
    });

    it('is not rendered when environments cannot be switched', () => {
      setup({ showEnv: false });
      expect(screen.queryByRole('button', { name: 'Environment' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sort' })).toBeInTheDocument();
    });
  });

  describe('sort menu', () => {
    it('offers the four sorts and marks the current one', async () => {
      setup({ sort: 'modified_desc' });
      await open('Sort');
      const options = await screen.findAllByRole('menuitemradio');
      expect(options.map((option) => option.textContent)).toEqual([
        'Name (A-Z)',
        'Name (Z-A)',
        'Last modified (newest)',
        'Last modified (oldest)',
      ]);
      expect(screen.getByRole('menuitemradio', { name: 'Last modified (newest)' })).toHaveAttribute(
        'aria-checked',
        'true'
      );
    });

    it.each([
      ['Name (Z-A)', 'name_desc'],
      ['Last modified (oldest)', 'modified_asc'],
    ])('reports %s as %s', async (label, value) => {
      const { onSortChange } = setup();
      await open('Sort');
      await userEvent.click(await screen.findByRole('menuitemradio', { name: label }));
      expect(onSortChange).toHaveBeenCalledWith(value);
    });
  });

  describe('filter menu', () => {
    it('shows both sources checked by default', async () => {
      setup();
      await open('Filter');
      expect(await screen.findByRole('menuitemcheckbox', { name: 'Workspace' })).toHaveAttribute(
        'aria-checked',
        'true'
      );
      expect(screen.getByRole('menuitemcheckbox', { name: '.env variables' })).toHaveAttribute('aria-checked', 'true');
    });

    it('draws no separator of its own: the header carries the only divider', async () => {
      setup();
      await open('Filter');
      await screen.findByRole('menuitemcheckbox', { name: 'Workspace' });
      expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    });

    it('draws the tick in the on-solid colour, not the item text colour', async () => {
      setup();
      await open('Filter');
      const tick = (await screen.findByRole('menuitemcheckbox', { name: 'Workspace' })).querySelector(
        '[aria-hidden] svg'
      );
      expect(tick).toHaveClass('tw-text-text-on-solid');
    });

    it('unchecks a source and keeps the menu open', async () => {
      const { onSourceChange } = setup();
      await open('Filter');
      await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: '.env variables' }));
      expect(onSourceChange).toHaveBeenCalledWith(['workspace']);
      expect(screen.getByRole('menuitemcheckbox', { name: 'Workspace' })).toBeInTheDocument();
    });

    it('reports sources in canonical order when one is re-checked', async () => {
      const { onSourceChange } = setup({ source: ['env'] });
      await open('Filter');
      await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Workspace' }));
      expect(onSourceChange).toHaveBeenCalledWith(['workspace', 'env']);
    });

    it('keeps the last checked source checked', async () => {
      const { onSourceChange } = setup({ source: ['workspace'] });
      await open('Filter');
      await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Workspace' }));
      expect(onSourceChange).not.toHaveBeenCalled();
    });

    it('narrows the options as the user types', async () => {
      setup();
      await open('Filter');
      await userEvent.type(await screen.findByRole('textbox', { name: 'Filter by' }), 'ENV');
      expect(screen.getByRole('menuitemcheckbox', { name: '.env variables' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitemcheckbox', { name: 'Workspace' })).not.toBeInTheDocument();
    });

    it('says so when no option matches', async () => {
      setup();
      await open('Filter');
      await userEvent.type(await screen.findByRole('textbox', { name: 'Filter by' }), 'zzz');
      expect(screen.getByText('No results')).toBeInTheDocument();
      expect(screen.queryAllByRole('menuitemcheckbox')).toHaveLength(0);
    });

    it('Clear all empties the text and restores every source', async () => {
      const { onSourceChange } = setup({ source: ['workspace'] });
      await open('Filter');
      const input = await screen.findByRole('textbox', { name: 'Filter by' });
      await userEvent.type(input, 'work');
      await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
      expect(input).toHaveValue('');
      expect(onSourceChange).toHaveBeenCalledWith(['workspace', 'env']);
    });

    it('Clear all leaves the view alone when every source is already shown', async () => {
      const { onSourceChange, onSortChange, onEnvChange } = setup();
      await open('Filter');
      const input = await screen.findByRole('textbox', { name: 'Filter by' });
      await userEvent.type(input, 'work');
      await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
      expect(input).toHaveValue('');
      expect(onSourceChange).not.toHaveBeenCalled();
      expect(onSortChange).not.toHaveBeenCalled();
      expect(onEnvChange).not.toHaveBeenCalled();
    });

    it('forgets the search text when the menu closes', async () => {
      setup();
      await open('Filter');
      await userEvent.type(await screen.findByRole('textbox', { name: 'Filter by' }), 'work');
      await userEvent.keyboard('{Escape}');
      await open('Filter');
      expect(await screen.findByRole('textbox', { name: 'Filter by' })).toHaveValue('');
    });
  });
});
