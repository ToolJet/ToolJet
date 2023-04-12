import React from 'react';
import Drawer from '@/_ui/Drawer';
import VariableForm from './VariableForm';

const ManageOrgVarsDrawer = ({
  isManageVarDrawerOpen,
  setIsManageVarDrawerOpen,
  fields,
  errors,
  selectedVariableId,
  createOrUpdate,
  handleEncryptionToggle,
  handleVariableTypeSelect,
  onCancelBtnClicked,
  addingVar,
  changeNewVariableOption,
}) => {
  return (
    <Drawer
      disableFocus={true}
      isOpen={isManageVarDrawerOpen}
      onClose={() => setIsManageVarDrawerOpen(false)}
      position="right"
    >
      <VariableForm
        fields={fields}
        errors={errors}
        selectedVariableId={selectedVariableId}
        createOrUpdate={createOrUpdate}
        changeNewVariableOption={changeNewVariableOption}
        handleEncryptionToggle={handleEncryptionToggle}
        handleVariableTypeSelect={handleVariableTypeSelect}
        onCancelBtnClicked={onCancelBtnClicked}
        addingVar={addingVar}
      />
    </Drawer>
  );
};

export default ManageOrgVarsDrawer;
