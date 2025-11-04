import React from 'react';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '../empty';

export default {
  title: 'UI/Rocket/Empty',
  component: Empty,
  tags: ['autodocs'],
};

export const Default = () => (
  <Empty>
    <EmptyHeader>
      <EmptyTitle>No items found</EmptyTitle>
      <EmptyDescription>Get started by creating a new item.</EmptyDescription>
    </EmptyHeader>
  </Empty>
);





