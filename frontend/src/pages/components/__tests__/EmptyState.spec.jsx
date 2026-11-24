import React from 'react';
import { render, screen } from '@testing-library/react';

import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  test('renders the title, and the description only when given', () => {
    const { rerender } = render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('Try again later')).not.toBeInTheDocument();

    rerender(<EmptyState title="Nothing here" description="Try again later" />);
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });

  test('renders an icon inside a tinted media tile', () => {
    render(<EmptyState title="Nothing here" icon={<svg data-testid="icon" />} />);

    expect(screen.getByTestId('icon').parentElement.className).toMatch(/tw-rounded-lg/);
  });

  test('renders an illustration as is, without the icon tile', () => {
    render(<EmptyState title="Nothing here" illustration={<svg data-testid="art" />} />);

    expect(screen.getByTestId('art')).toBeInTheDocument();
    expect(screen.getByTestId('art').parentElement.className).not.toMatch(/tw-rounded-lg/);
  });

  test('renders no media wrapper when there is neither an icon nor an illustration', () => {
    render(<EmptyState title="Nothing here" />);

    // Header holds only the title.
    expect(screen.getByText('Nothing here').parentElement.children).toHaveLength(1);
  });

  test('renders children as the content under the text, and nothing when there are none', () => {
    const { rerender, container } = render(<EmptyState title="Nothing here" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const rootChildCount = container.firstChild.children.length;

    rerender(
      <EmptyState title="Nothing here">
        <button type="button">Add new</button>
      </EmptyState>
    );
    expect(screen.getByRole('button', { name: 'Add new' })).toBeInTheDocument();
    expect(container.firstChild.children).toHaveLength(rootChildCount + 1);
  });

  test('passes data-cy to the root', () => {
    const { container } = render(<EmptyState title="Nothing here" data-cy="my-empty" />);

    expect(container.firstChild).toHaveAttribute('data-cy', 'my-empty');
  });

  describe('classes', () => {
    test('applies a class to each part', () => {
      const { container } = render(
        <EmptyState
          title="Nothing here"
          description="Try again later"
          icon={<svg data-testid="icon" />}
          classes={{
            root: 'c-root',
            header: 'c-header',
            media: 'c-media',
            title: 'c-title',
            description: 'c-description',
            content: 'c-content',
          }}
        >
          <button type="button">Add new</button>
        </EmptyState>
      );

      expect(container.firstChild).toHaveClass('c-root');
      expect(screen.getByText('Nothing here').parentElement).toHaveClass('c-header');
      expect(screen.getByTestId('icon').parentElement).toHaveClass('c-media');
      expect(screen.getByText('Nothing here')).toHaveClass('c-title');
      expect(screen.getByText('Try again later')).toHaveClass('c-description');
      expect(screen.getByRole('button').parentElement).toHaveClass('c-content');
    });

    test('a conflicting utility replaces the default instead of stacking with it', () => {
      const { container } = render(<EmptyState title="Nothing here" classes={{ root: 'tw-py-4' }} />);

      expect(container.firstChild).toHaveClass('tw-py-4');
      expect(container.firstChild).not.toHaveClass('tw-py-10');
    });
  });
});
