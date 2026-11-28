import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import { Tag } from '../Tag';

describe('Tag | static', () => {
  it('shows the label and is not interactive', () => {
    render(<Tag>{'title contains "filters"'}</Tag>);

    expect(screen.getByText('title contains "filters"')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a muted prefix before the label', () => {
    render(<Tag prefix="On update">RESTRICT</Tag>);

    expect(screen.getByText('On update')).toBeInTheDocument();
    expect(screen.getByText('RESTRICT')).toBeInTheDocument();
  });
});

describe('Tag | removable', () => {
  it('names the remove button after the label', () => {
    render(
      <Tag removable onRemove={jest.fn()}>
        {'tag equals "feature"'}
      </Tag>
    );

    expect(screen.getByRole('button', { name: 'Remove tag equals "feature"' })).toBeInTheDocument();
  });

  it('calls onRemove without triggering onClick', async () => {
    const onRemove = jest.fn();
    const onClick = jest.fn();
    render(
      <Tag removable onRemove={onRemove} onClick={onClick}>
        a
      </Tag>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Remove a' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses removeLabel when the label is not plain text', () => {
    render(
      <Tag removable onRemove={jest.fn()} removeLabel="Remove filter 3">
        <strong>x</strong>
      </Tag>
    );

    expect(screen.getByRole('button', { name: 'Remove filter 3' })).toBeInTheDocument();
  });
});

describe('Tag | clickable', () => {
  it('is a button that calls onClick', async () => {
    const onClick = jest.fn();
    render(<Tag onClick={onClick}>+3 more</Tag>);

    await userEvent.click(screen.getByRole('button', { name: '+3 more' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps the remove button out of the clickable one (no nested buttons)', () => {
    render(
      <Tag removable onRemove={jest.fn()} onClick={jest.fn()}>
        a
      </Tag>
    );

    const [main, remove] = screen.getAllByRole('button');
    expect(main).not.toContainElement(remove);
  });

  it('does nothing while disabled', async () => {
    const onClick = jest.fn();
    const onRemove = jest.fn();
    render(
      <Tag disabled removable onRemove={onRemove} onClick={onClick}>
        a
      </Tag>
    );

    await userEvent.click(screen.getByRole('button', { name: 'a' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove a' }));

    expect(onClick).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('shows a spinner and ignores clicks while loading', async () => {
    const onClick = jest.fn();
    render(
      <Tag loading onClick={onClick}>
        a
      </Tag>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /a/ }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
