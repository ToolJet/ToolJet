import React from 'react';
import EmptyState from './EmptyState';
import { ManageOrgConstants } from './components';
import Footer from './Footer';
import ConstantForm from './ConstantForm';
import ConstantTable from './ConstantTable';
import './ConstantFormStyle.scss';

const ManageOrgConstantsSettings = (props) => {
  return (
    <ManageOrgConstants
      {...props}
      EmptyState={EmptyState}
      Footer={Footer}
      ConstantForm={ConstantForm}
      ConstantTable={ConstantTable}
    />
  );
};

export default ManageOrgConstantsSettings;
