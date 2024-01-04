import React from 'react';
import { List } from '../List';
import { OrganizationList } from '@/_components/OrganizationManager/List';

export const CreateDataSource = ({ updateSelectedDatasource }) => {
  return (
    <>
      <List updateSelectedDatasource={updateSelectedDatasource} />
      <OrganizationList />
    </>
  );
};
