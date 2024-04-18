import React, { useContext, useState } from 'react';
import SourceKeyRelation from './TableKeyRelations';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';

const ForeignKeyTableForm = ({ tableName, columns, isEditMode, onClose }) => {
  return (
    <div className="foreignKeyRelation-form-container">
      <div className="card-header">
        <h3 className="card-title" data-cy="create-new-table-header">
          Create foreign key relation
        </h3>
      </div>
      <SourceKeyRelation tableName={tableName} columns={columns} isEditMode={isEditMode} />
      <DrawerFooter
        fetching={false}
        isEditMode={false}
        onClose={onClose}
        onEdit={() => {}}
        onCreate={() => {}}
        shouldDisableCreateBtn={false}
      />
    </div>
  );
};

export default ForeignKeyTableForm;
