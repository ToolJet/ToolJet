import React from 'react';
import { render, screen, within } from '@testing-library/react';
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
    const openSort = async (props) => {
      const handlers = setup(props);
      await open('Sort');
      await screen.findByRole('textbox', { name: 'Sort by' });
      return handlers;
    };

    it('offers the four sorts in two groups and marks the current one', async () => {
      await openSort({ sort: 'modified_desc' });
      const options = screen.getAllByRole('menuitemcheckbox');
      expect(options.map((option) => option.textContent)).toEqual(['A → Z', 'Z → A', 'Newest first', 'Oldest first']);
      expect(options.map((option) => option.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true', 'false']);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Last modified')).toBeInTheDocument();
    });

    it('has no recent-activity group', async () => {
      await openSort();
      expect(screen.queryByText('Recent activity')).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitemcheckbox', { name: 'Latest first' })).not.toBeInTheDocument();
    });

    it('draws one divider, between the groups: the header carries its own', async () => {
      await openSort();
      expect(screen.getAllByRole('separator')).toHaveLength(1);
    });

    it.each([
      ['A → Z', 'name_asc', 'modified_desc'],
      ['Z → A', 'name_desc', 'name_asc'],
      ['Newest first', 'modified_desc', 'name_asc'],
      ['Oldest first', 'modified_asc', 'name_asc'],
    ])('reports %s as %s', async (label, value, current) => {
      const { onSortChange } = await openSort({ sort: current });
      await userEvent.click(screen.getByRole('menuitemcheckbox', { name: label }));
      expect(onSortChange).toHaveBeenCalledWith(value);
    });

    it('keeps the current sort when its own option is clicked', async () => {
      const { onSortChange } = await openSort({ sort: 'name_asc' });
      await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'A → Z' }));
      expect(onSortChange).not.toHaveBeenCalled();
    });

    it('draws the tick in the on-solid colour, not the item text colour', async () => {
      await openSort({ sort: 'name_asc' });
      const tick = screen.getByRole('menuitemcheckbox', { name: 'A → Z' }).querySelector('[aria-hidden] svg');
      expect(tick).toHaveClass('tw-text-text-on-solid');
    });

    it('narrows the options as the user types, and drops a group left empty', async () => {
      await openSort();
      await userEvent.type(screen.getByRole('textbox', { name: 'Sort by' }), 'NEW');
      expect(screen.getAllByRole('menuitemcheckbox').map((option) => option.textContent)).toEqual(['Newest first']);
      expect(screen.queryByText('Name')).not.toBeInTheDocument();
      expect(screen.getByText('Last modified')).toBeInTheDocument();
    });

    it('keeps every option of a group whose name matches', async () => {
      await openSort();
      await userEvent.type(screen.getByRole('textbox', { name: 'Sort by' }), 'last');
      expect(screen.getAllByRole('menuitemcheckbox').map((option) => option.textContent)).toEqual([
        'Newest first',
        'Oldest first',
      ]);
    });

    it('says so when no option matches', async () => {
      await openSort();
      await userEvent.type(screen.getByRole('textbox', { name: 'Sort by' }), 'zzz');
      expect(screen.getByText('No results')).toBeInTheDocument();
      expect(screen.queryAllByRole('menuitemcheckbox')).toHaveLength(0);
    });

    it('Reset empties the text and goes back to the default sort', async () => {
      const { onSortChange } = await openSort({ sort: 'name_desc' });
      const input = screen.getByRole('textbox', { name: 'Sort by' });
      await userEvent.type(input, 'new');
      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
      expect(input).toHaveValue('');
      expect(onSortChange).toHaveBeenCalledWith('modified_desc');
    });

    it('Reset leaves the view alone when it already shows the default', async () => {
      const { onSortChange } = await openSort({ sort: 'modified_desc' });
      const input = screen.getByRole('textbox', { name: 'Sort by' });
      await userEvent.type(input, 'new');
      await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
      expect(input).toHaveValue('');
      expect(onSortChange).not.toHaveBeenCalled();
    });

    it('forgets the search text when the menu closes', async () => {
      await openSort();
      await userEvent.type(screen.getByRole('textbox', { name: 'Sort by' }), 'new');
      await userEvent.keyboard('{Escape}');
      await open('Sort');
      expect(await screen.findByRole('textbox', { name: 'Sort by' })).toHaveValue('');
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

  describe('applied filters', () => {
    it('shows nothing while every source is shown', () => {
      setup();
      expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('applied-filters')).not.toBeInTheDocument();
    });

    it.each([
      [['workspace'], 'Workspace'],
      [['env'], '.env variables'],
    ])('shows %p as a chip with a clear-all action', (source, label) => {
      setup({ source });
      expect(within(screen.getByTestId('applied-filters')).getByText(label)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument();
    });

    it('removing the chip shows every source again', async () => {
      const { onSourceChange } = setup({ source: ['workspace'] });
      await userEvent.click(screen.getByRole('button', { name: 'Remove Workspace filter' }));
      expect(onSourceChange).toHaveBeenCalledWith(['workspace', 'env']);
    });

    it('Clear all filters shows every source again', async () => {
      const { onSourceChange } = setup({ source: ['env'] });
      await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
      expect(onSourceChange).toHaveBeenCalledWith(['workspace', 'env']);
    });

    it('does not touch the sort or the environment', async () => {
      const { onSortChange, onEnvChange } = setup({ source: ['env'] });
      await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
      expect(onSortChange).not.toHaveBeenCalled();
      expect(onEnvChange).not.toHaveBeenCalled();
    });
  });

  describe('icon buttons', () => {
    it.each(['Filter', 'Sort'])('%s explains itself in a tooltip on hover', async (name) => {
      setup();
      await userEvent.hover(screen.getByRole('button', { name }));
      expect(await screen.findByRole('tooltip')).toHaveTextContent(name);
    });

    it.each(['Filter', 'Sort'])('%s still opens its menu', async (name) => {
      setup();
      await userEvent.hover(screen.getByRole('button', { name }));
      await open(name);
      expect(await screen.findByRole('textbox', { name: `${name} by` })).toBeInTheDocument();
    });

    it.each(['Filter', 'Sort'])('%s icon uses the strong icon colour', (name) => {
      setup();
      expect(screen.getByRole('button', { name }).querySelector('svg')).toHaveClass('tw-text-icon-strong');
    });
  });
});
