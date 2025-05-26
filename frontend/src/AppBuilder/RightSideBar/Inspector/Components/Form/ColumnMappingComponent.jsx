import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import Checkbox from '@/components/ui/Checkbox/Index';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Modal from 'react-bootstrap/Modal';
import Dropdown from '@/components/ui/Dropdown/Index';
import Input from '@/components/ui/Input/Index';
import { getInputTypeOptions, isTrueValue, isPropertyFxControlled } from './utils';

/**
 * Disable the checkbox if the property is fx controlled and it will not be included while selectAll is called.
 * This is to prevent users from changing the state of fx controlled properties directly.
 * Instead, they should use the fx editor to manage these properties.
 *
 */

const ColumnMappingRow = ({
  column, // column now contains both database info and form config
  onChange,
  onCheckboxChange,
  index,
  darkMode = false,
}) => {
  if (!column) return null;

  const inputTypeOptions = getInputTypeOptions(darkMode);

  const isSelectedFxControlled = isPropertyFxControlled(column.selected);
  const isMandatoryFxControlled = isPropertyFxControlled(column.mandatory);

  const handleLabelChange = (e) => {
    onChange?.({
      ...column,
      label: e.target.value,
    });
  };

  const handleMandatoryChange = (checked) => {
    if (typeof column.mandatory === 'object') {
      onChange?.({
        ...column,
        mandatory: {
          ...column.mandatory,
          value: checked,
        },
      });
    } else {
      onChange?.({
        ...column,
        mandatory: checked,
      });
    }
  };

  const handleInputTypeChange = (value) => {
    onChange?.({
      ...column,
      componentType: value,
    });
  };

  return (
    <div className="tw-flex tw-items-center tw-w-full tw-py-3 tw-px-2 tw-border-b tw-border-border-lighter column-mapping-row">
      {/* Checkbox */}
      <div className="tw-w-6">
        <Checkbox
          checked={isTrueValue(column.selected.value)}
          onCheckedChange={onCheckboxChange}
          disabled={isSelectedFxControlled} // Disable if fx controlled
        />
      </div>

      {/* Column Name and Type */}
      <div className="name-column tw-flex tw-items-center base-regular tw-justify-between">
        {column.key ? (
          <span className="base-regular">{column.key}</span>
        ) : (
          <span className="no-mapped-column small-medium">No mapped columns</span>
        )}
      </div>

      {/* Mapped To */}
      <div
        className={cx('arrow-column tw-flex tw-justify-center', {
          'tw-invisible': column.key === undefined,
        })}
      >
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
        <Checkbox
          checked={isTrueValue(column.mandatory.value)}
          onCheckedChange={handleMandatoryChange}
          disabled={isMandatoryFxControlled} // Disable if fx controlled
        />
      </div>
    </div>
  );
};

const RenderSection = ({ mappedColumns = [], setMappedColumns, darkMode, sectionType, sectionDisplayName }) => {
  // Ensure mappedColumns is always an array
  const columnsArray = Array.isArray(mappedColumns) ? mappedColumns : [];

  const selectableColumns = columnsArray.filter((col) => !isPropertyFxControlled(col.selected));
  const mandatorySettableColumns = columnsArray.filter((col) => !isPropertyFxControlled(col.mandatory));

  const isAllSelected =
    selectableColumns.length > 0 ? selectableColumns.every((col) => isTrueValue(col.selected.value)) : false;

  const isIntermediateSelected = !isAllSelected && selectableColumns.some((col) => isTrueValue(col.selected.value));

  const isAllSelectedMandatory =
    mandatorySettableColumns.length > 0
      ? mandatorySettableColumns.every((col) => isTrueValue(col.mandatory.value))
      : false;

  const isIntermediateMandatory =
    !isAllSelectedMandatory && mandatorySettableColumns.some((col) => isTrueValue(col.mandatory.value));

  const handleSelectAll = (checked) => {
    if (columnsArray.length > 0) {
      const updatedColumns = columnsArray.map((col) => {
        if (isPropertyFxControlled(col.selected)) {
          return col;
        }

        return {
          ...col,
          selected: {
            ...col.selected,
            value: checked,
          },
        };
      });
      setMappedColumns(updatedColumns);
    }
  };

  const handleSelectAllMandatory = (checked) => {
    if (columnsArray.length > 0) {
      const updatedColumns = columnsArray.map((col) => {
        if (isPropertyFxControlled(col.mandatory)) {
          return col;
        }

        return {
          ...col,
          mandatory: {
            ...col.mandatory,
            value: checked,
          },
        };
      });
      setMappedColumns(updatedColumns);
    }
  };

  const handleColumnSelect = (columnName, checked) => {
    if (columnsArray.length > 0) {
      const updatedColumns = columnsArray.map((col) => {
        if (col.name !== columnName || isPropertyFxControlled(col.selected)) {
          return col;
        }

        if (typeof col.selected === 'object') {
          return {
            ...col,
            selected: {
              ...col.selected,
              value: checked,
            },
          };
        } else {
          return {
            ...col,
            selected: checked,
          };
        }
      });
      setMappedColumns(updatedColumns);
    }
  };

  const handleColumnChange = (columnName, changes) => {
    if (columnsArray.length > 0) {
      const updatedColumns = columnsArray.map((col) => (col.name === columnName ? { ...col, ...changes } : col));
      setMappedColumns(updatedColumns);
    }
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
      </div>
    );
  };

  return (
    <div className="tw-w-full column-mapping-modal-body-content tw-mb-6">
      <div
        className={cx('large-medium column-mapping-modal-title', {
          new: sectionType === 'isNew',
          removed: sectionType === 'isRemoved',
          'tw-hidden': sectionDisplayName === '',
        })}
      >
        {sectionDisplayName}
      </div>

      {/* Header Row */}
      {renderHeader()}

      {/* Rows */}
      <div className="tw-max-h-[400px] tw-overflow-y-auto">
        {columnsArray.length > 0 ? (
          columnsArray.map((column, index) => (
            <ColumnMappingRow
              key={column.name}
              column={columnsArray.find((c) => c.name === column.name)}
              onCheckboxChange={(checked) => handleColumnSelect(column.name, checked)}
              onChange={(changes) => handleColumnChange(column.name, changes)}
              index={index}
              darkMode={darkMode}
            />
          ))
        ) : (
          <div className="tw-py-4 tw-text-center tw-text-gray-500">No {sectionDisplayName.toLowerCase()} available</div>
        )}
      </div>
    </div>
  );
};

const ColumnMappingComponent = ({ isOpen, onClose, columns = [], darkMode = false, onSubmit, isFormGenerated }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [groupedColumns, setGroupedColumns] = useState({});
  const [sectionTypes, setSectionTypes] = useState([]);

  // Group columns by section type on component load or when columns change
  useEffect(() => {
    const groupBySection = () => {
      // Create a map to hold columns by section
      const grouped = {};

      // Group columns by their section type
      columns.forEach((col) => {
        let sectionType = 'existing'; // Default to 'existing' if no section property found

        if (col.isNew) {
          sectionType = 'isNew';
        } else if (col.isRemoved) {
          sectionType = 'isRemoved';
        } else if (col.isCustomField) {
          sectionType = 'isCustomField';
        } else {
          sectionType = 'existing'; // Default to 'existing' if no other type matches
        }

        if (!grouped[sectionType]) {
          grouped[sectionType] = [];
        }
        grouped[sectionType].push(col);
      });

      // Get unique section types
      const types = Object.keys(grouped);

      setGroupedColumns(grouped);
      setSectionTypes(types);
    };

    groupBySection();
  }, [columns]);

  // Update a specific section's columns
  const updateSectionColumns = (sectionType, updatedColumns) => {
    setGroupedColumns((prev) => ({
      ...prev,
      [sectionType]: updatedColumns,
    }));
  };

  const handleSubmit = () => {
    setIsSaving(true);

    // Flatten all columns from all sections back into a single array
    const combinedColumns = Object.values(groupedColumns).flat();

    onSubmit?.(combinedColumns);
  };

  // Get display name for section type
  const getSectionDisplayName = (sectionType) => {
    const displayNames = {
      existing: 'Existing',
      isCustomField: 'Custom fields',
      isNew: 'New',
      isRemoved: 'Removed',
    };

    return displayNames[sectionType];
  };

  // Check if all sections have no selected items
  // Fix: Make sure we're only calling .every on arrays, and add safety checks
  const allSectionsEmpty = Object.values(groupedColumns).every((sectionColumns) => {
    // Check if sectionColumns is an array before calling .every
    return Array.isArray(sectionColumns) ? sectionColumns.every((col) => !col.selected) : true;
  });

  const modalBody = (
    <div className="tw-w-full column-mapping-modal-body-container">
      {/* Render each section dynamically */}
      {sectionTypes.length > 0 && (
        <>
          {sectionTypes.map(
            (sectionType) =>
              groupedColumns[sectionType]?.length > 0 && (
                <RenderSection
                  key={sectionType}
                  mappedColumns={groupedColumns[sectionType]}
                  setMappedColumns={(updatedColumns) => updateSectionColumns(sectionType, updatedColumns)}
                  darkMode={darkMode}
                  sectionType={sectionType}
                  sectionDisplayName={isFormGenerated ? getSectionDisplayName(sectionType) : ''}
                />
              )
          )}
        </>
      )}

      {/* Footer */}
      <div className="tw-flex tw-justify-end tw-mt-4">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSaving || allSectionsEmpty}
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
            <h4 className="text-default tw-font-ibmplex tw-font-medium tw-leading-5 tw-m-0">
              {isFormGenerated ? 'Manage fields' : 'Map columns'}
            </h4>
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
