import React from 'react';
import { PaginationFooter } from '../PaginationFooter';

export default {
  title: 'UI/Blocks/PaginationFooter',
  component: PaginationFooter,
  parameters: {
    layout: 'padded',
  },
};

export const Default = () => (
  <PaginationFooter recordCount={50} currentPage={3} totalPages={10} canPreviousPage={true} canNextPage={true} />
);

export const FirstPage = () => (
  <PaginationFooter recordCount={50} currentPage={1} totalPages={10} canPreviousPage={false} canNextPage={true} />
);

export const LastPage = () => (
  <PaginationFooter recordCount={50} currentPage={10} totalPages={10} canPreviousPage={true} canNextPage={false} />
);

export const ManyPages = () => (
  <PaginationFooter recordCount={500} currentPage={25} totalPages={50} canPreviousPage={true} canNextPage={true} />
);

export const Loading = () => <PaginationFooter isLoading={true} />;

export const SinglePage = () => (
  <PaginationFooter recordCount={5} currentPage={1} totalPages={1} canPreviousPage={false} canNextPage={false} />
);

export const FewPages = () => (
  <PaginationFooter recordCount={35} currentPage={2} totalPages={4} canPreviousPage={true} canNextPage={true} />
);

