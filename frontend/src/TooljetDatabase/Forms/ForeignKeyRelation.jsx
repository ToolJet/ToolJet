import React, { useState } from 'react';
import Information from '../Icons/information.svg';
import ForeignKeyRelationIcon from '../Icons/Fk-relation.svg';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Drawer from '@/_ui/Drawer';
import ForeignKeyTableForm from './ForeignKeyTableForm';
import EditIcon from '../Icons/EditColumn.svg';
import _, { isEmpty } from 'lodash';

function ForeignKeyRelation({
  onMouseHoverFunction = () => {},
  setIndexHoveredColumn = () => {},
  tableName,
  columns,
  isEditMode,
}) {
  const [isForeignKeyDraweOpen, setIsForeignKeyDraweOpen] = useState(false);
  return (
    <>
      <div className="foreignkey-relation-container">
        <div className="foreign-key-heading">
          <span>Foreign key relation</span>
        </div>

        <div className="empty-foreignkey-container d-flex align-items-center justify-content-center rounded mt-2 p-2">
          <Information width="20" />
          <p style={{ marginLeft: '6px', color: '#687076' }} className="mb-0">
            No relation added yet
          </p>
        </div>

        <div className="foreignKey-details" onClick={() => onMouseHoverFunction('Name')}>
          <span className="foreignKey-text">Name</span>
          <div className="foreign-key-relation">
            <ForeignKeyRelationIcon width="13" height="13" />
          </div>
          <span className="foreignKey-text">table2.column4</span>
          <div className="editForeignkey" onClick={() => setIsForeignKeyDraweOpen(true)}>
            <EditIcon width="17" height="18" />
          </div>
        </div>

        <div className="d-flex mb-2 mt-2 border-none" style={{ maxHeight: '32px' }}>
          <ButtonSolid
            variant="ghostBlue"
            size="sm"
            style={{ fontSize: '14px' }}
            onClick={() => setIsForeignKeyDraweOpen(true)}
            disabled={isEmpty(tableName)}
          >
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp; Add relation
          </ButtonSolid>
        </div>
      </div>
      <Drawer
        isOpen={isForeignKeyDraweOpen}
        position="right"
        drawerStyle={{ width: '500px' }}
        isForeignKeyRelation={true}
        onClose={() => setIsForeignKeyDraweOpen(false)}
      >
        <ForeignKeyTableForm
          tableName={tableName}
          columns={columns}
          isEditMode={isEditMode}
          onClose={() => setIsForeignKeyDraweOpen(false)}
        />
      </Drawer>
    </>
  );
}

export default ForeignKeyRelation;
