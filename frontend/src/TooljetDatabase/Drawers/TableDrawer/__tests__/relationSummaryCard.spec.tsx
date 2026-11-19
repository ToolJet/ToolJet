import React from 'react';
import { render, screen } from '@/test/test-utils';
import { RelationSummaryCard } from '../RelationSummaryCard';
import type { DraftRelation } from '../types';

const relation: DraftRelation = {
  id: 'relation-1',
  column_names: ['owner_id'],
  referenced_table_name: 'users',
  referenced_column_names: ['id'],
  on_update: 'CASCADE',
  on_delete: 'RESTRICT',
};

const renderCard = (layout?: 'wide' | 'narrow') =>
  render(
    <RelationSummaryCard
      relation={relation}
      sourceTableName="orders"
      layout={layout}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />
  );

// The first flex row the node sits in, as a way to tell "same row" from "wrapped below".
const rowOf = (node: HTMLElement) =>
  node.closest('[class*="tw-w-full"][class*="tw-items-center"]') as HTMLElement | null;

describe('RelationSummaryCard', () => {
  it('shows both ends as column over table, and the two actions as tags', () => {
    renderCard();
    expect(screen.getByText('owner_id')).toBeInTheDocument();
    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('CASCADE')).toBeInTheDocument();
    expect(screen.getByText('RESTRICT')).toBeInTheDocument();
  });

  it('wide: the tags share the row with the relation and the actions', () => {
    renderCard('wide');
    const edit = screen.getByRole('button', { name: 'Edit relation on owner_id' });
    expect(rowOf(screen.getByText('CASCADE'))).toBe(rowOf(edit));
  });

  it('narrow: the tags wrap below the relation row', () => {
    renderCard('narrow');
    const edit = screen.getByRole('button', { name: 'Edit relation on owner_id' });
    expect(rowOf(screen.getByText('CASCADE'))).not.toBe(rowOf(edit));
  });

  it('defaults to wide', () => {
    renderCard();
    const edit = screen.getByRole('button', { name: 'Edit relation on owner_id' });
    expect(rowOf(screen.getByText('CASCADE'))).toBe(rowOf(edit));
  });
});
