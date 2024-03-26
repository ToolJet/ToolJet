import React, { useState } from 'react';
import Information from '../Icons/information.svg';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Drawer from '@/_ui/Drawer';
import ForeignKeyTableForm from './ForeignKeyTableForm';

function ForeignKeyRelation() {
  const [isForeignKeyDraweOpen, setIsForeignKeyDraweOpen] = useState(false);
  //   const handleOpenDrawer = () => {
  //     setIsCreateTableDrawerOpen(true);
  //   };
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
        <div className="d-flex mb-2 mt-2 border-none" style={{ maxHeight: '32px' }}>
          <ButtonSolid
            variant="ghostBlue"
            size="sm"
            style={{ fontSize: '14px' }}
            onClick={() => setIsForeignKeyDraweOpen(true)}
          >
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp; Add relation
          </ButtonSolid>
        </div>
      </div>
      <Drawer
        isOpen={isForeignKeyDraweOpen}
        onClose={() => setIsForeignKeyDraweOpen(false)}
        position="right"
        drawerStyle={{ width: '500px' }}
      >
        <ForeignKeyTableForm />
      </Drawer>
    </>
  );
}

export default ForeignKeyRelation;
