import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import Checkbox from '@/components/ui/Checkbox/Index';
import { cn } from '@/lib/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Modal from 'react-bootstrap/Modal';
import Dropdown from '@/components/ui/Dropdown/Index';
import Input from '@/components/ui/Input/Index';
import { getInputTypeOptions } from './utils';

const ColumnMappingRow = ({
  column, // column now contains both database info and form config
  onDelete,
  onChange,
  onCheckboxChange,
  isChecked,
  mode = 'mapping',
  index,
  darkMode = false,
}) => {
  if (!column) return null;

  const inputTypeOptions = getInputTypeOptions(darkMode);

  const handleLabelChange = (e) => {
    onChange?.({
      ...column,
      label: e.target.value,
    });
  };

  const handleMandatoryChange = (checked) => {
    onChange?.({
      ...column,
      mandatory: checked,
    });
  };

  const handleInputTypeChange = (value) => {
    onChange?.({
      ...column,
      component: value,
    });
  };

  return (
    <div className="tw-flex tw-items-center tw-w-full tw-py-3 tw-px-2 tw-border-b tw-border-border-lighter column-mapping-row">
      {/* Checkbox */}
      <div className="tw-w-6">
        <Checkbox checked={isChecked} onCheckedChange={onCheckboxChange} />
      </div>

      {/* Column Name and Type */}
      <div className="name-column tw-flex tw-items-center base-regular tw-justify-between">
        <span className="base-regular">{column.name}</span>
        <span className="tw-ml-2 data-type">{column.dataType}</span>
      </div>

      {/* Mapped To */}
      <div className="arrow-column tw-flex tw-justify-center">
        <SolidIcon name="arrowright" width="24" height="24" fill="#CCD1D5" />
      </div>

      {/* Input Type Selector */}
      <div className="mapped-column tw-relative hide-border">
        <Dropdown
          options={inputTypeOptions}
          name={`dropdown-${index}`}
          id={`dropdown-${index}`}
          size="small"
          zIndex={9999}
          value={column.componentType || 'TextInput'}
          leadingIcon={inputTypeOptions[column.componentType || 'TextInput'].leadingIcon}
          onChange={handleInputTypeChange}
          width="140px"
        />
      </div>

      {/* Input Label */}
      <div className="type-column rows tw-flex-1 hide-border">
        <Input value={column.label} onChange={handleLabelChange} placeholder="Input label" size="small" />
      </div>

      {/* Mandatory Checkbox */}
      <div className="mandatory-column rows tw-flex tw-justify-end">
        <Checkbox checked={column.mandatory} onCheckedChange={handleMandatoryChange} />
      </div>

      {/* Actions */}
      {mode === 'manage' && (
        <div className="tw-w-10 tw-flex tw-justify-center">
          <Button iconOnly leadingIcon="Dots" variant="ghost" size="small" onClick={onDelete} />
        </div>
      )}
    </div>
  );
};

const RenderSection = ({ mappedColumns = [], setMappedColumns, title, mode = 'mapping', darkMode }) => {
  // const [mappedColumns, setMappedColumns] = useState(columns);
  // Compute states from mappedColumns
  const isAllSelected = mappedColumns.every((col) => col.selected);
  const isIntermediateSelected = !isAllSelected && mappedColumns.some((col) => col.selected);
  const isAllSelectedMandatory = mappedColumns.every((col) => col.mandatory);
  const isIntermediateMandatory = !isAllSelectedMandatory && mappedColumns.some((col) => col.mandatory);

  const isNew = mode === 'new';
  const isRemoved = mode === 'removed';

  const handleSelectAll = (checked) => {
    setMappedColumns((prev) =>
      prev.map((col) => ({
        ...col,
        selected: checked,
      }))
    );
  };

  const handleSelectAllMandatory = (checked) => {
    setMappedColumns((prev) =>
      prev.map((col) => ({
        ...col,
        mandatory: checked,
      }))
    );
  };

  const handleColumnSelect = (columnName, checked) => {
    setMappedColumns((prev) => prev.map((col) => (col.name === columnName ? { ...col, selected: checked } : col)));
  };

  const handleColumnChange = (columnName, changes) => {
    setMappedColumns((prev) => prev.map((col) => (col.name === columnName ? { ...col, ...changes } : col)));
  };

  const renderEditableIcon = () => {
    return (
      <div className="tw-mr-2 editable-icon">
        <SolidIcon name="editable" width="12" height="12" fill={darkMode ? '#4C5155' : '#C1C8CD'} vievBox="0 0 12 12" />
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div className="tw-flex tw-items-center tw-w-full tw-py-[10px] tw-px-2 header-row column-mapping-row">
        <div className="tw-w-6 header-column">
          <Checkbox
            checked={isAllSelected || isIntermediateSelected}
            onCheckedChange={handleSelectAll}
            intermediate={isIntermediateSelected}
          />
        </div>
        <div className="name-column header-column">
          <span className="text-default small-medium">Column name</span>
        </div>
        <div className="arrow-column header-column" />
        <div className="mapped-column header-column tw-flex">
          {renderEditableIcon()}
          <span className="text-default small-medium">Mapped to</span>
        </div>
        <div className="type-column tw-flex-1 header-column tw-flex">
          {renderEditableIcon()}
          <span className="text-default small-medium">Input label</span>
        </div>
        <div className="mandatory-column header-column tw-flex tw-justify-end">
          <span className="text-default small-medium tw-mr-2">Mandatory?</span>
          <Checkbox
            checked={isAllSelectedMandatory || isIntermediateMandatory}
            onCheckedChange={handleSelectAllMandatory}
            intermediate={!isAllSelectedMandatory && isIntermediateMandatory}
          />
        </div>
        {mode === 'manage' && <div className="tw-w-10" />}
      </div>
    );
  };

  return (
    <div className="tw-w-full column-mapping-modal-body-content">
      <div className={cn('large-medium column-mapping-modal-title', { new: isNew, removed: isRemoved })}>Existing</div>
      {/* Header Row */}
      {renderHeader()}

      {/* Rows */}
      <div className="tw-max-h-[400px] tw-overflow-y-auto">
        {mappedColumns.map((column, index) => (
          <ColumnMappingRow
            key={column.name}
            column={mappedColumns.find((c) => c.name === column.name)}
            isChecked={mappedColumns.find((c) => c.name === column.name)?.selected}
            onCheckboxChange={(checked) => handleColumnSelect(column.name, checked)}
            onChange={(changes) => handleColumnChange(column.name, changes)}
            mode={mode}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

const ColumnMappingComponent = ({
  isOpen,
  onClose,
  columns = [],
  mode = 'mapping',
  darkMode = false,
  onSubmit,
  isFormGenerated,
  title,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [mappedColumns, setMappedColumns] = useState(columns);

  useEffect(() => {
    setMappedColumns(columns);
  }, [columns]);

  const handleSubmit = () => {
    setIsSaving(true);
    onSubmit?.(mappedColumns);
    // setTimeout(() => {
    //   setIsGenerating(false);
    // }, 500);
  };

  const modalBody = (
    <div className="tw-w-full column-mapping-modal-body-container">
      <RenderSection
        mappedColumns={mappedColumns}
        setMappedColumns={setMappedColumns}
        title={title}
        mode={mode}
        darkMode={darkMode}
      />
      {/* Footer */}
      <div className="tw-flex tw-justify-end tw-mt-4">
        <Button
          variant="primary"
          onClick={handleSubmit}
          // disabled={mappedColumns.every((col) => !col.selected) || isSaving}
          disabled={isSaving}
          leadingIcon={isFormGenerated ? 'save' : 'plus'}
          isLoading={isSaving}
          loaderText={isFormGenerated ? 'Saving' : 'Generating'}
        >
          {isFormGenerated ? 'Save' : 'Generate form'}
        </Button>
      </div>
    </div>
  );

  const renderModal = () => {
    return (
      <Modal show={isOpen} onHide={onClose} size="lg">
        <div className="column-mapping-modal-header tw-flex tw-p-4 tw-flex-col tw-items-start tw-gap-2 tw-self-stretch tw-border-b bg-white">
          <div className="tw-flex tw-justify-between tw-items-center tw-w-full" style={{ height: '28px' }}>
            <h4 className="text-default tw-font-ibmplex tw-font-medium tw-leading-5 tw-m-0">Map columns</h4>
            <button
              className="tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer hover:tw-opacity-70"
              onClick={onClose}
            >
              <SolidIcon name="remove" width="16" height="16" fill="#6A727C" />
            </button>
          </div>
        </div>
        <div className="tw-p-4 column-mapping-modal-body">{modalBody}</div>
      </Modal>
    );
  };

  return renderModal();
};

export default ColumnMappingComponent;
