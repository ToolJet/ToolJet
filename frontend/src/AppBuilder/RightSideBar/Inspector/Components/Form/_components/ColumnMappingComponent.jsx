import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import Checkbox from '@/components/ui/Checkbox/Index';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Modal from 'react-bootstrap/Modal';
import Dropdown from '@/components/ui/Dropdown/Index';
import Input from '@/components/ui/Input/Index';
import {
  getInputTypeOptions,
  isTrueValue,
  isPropertyFxControlled,
  parseDataAndBuildFields,
  analyzeJsonDifferences,
  mergeFieldsWithComponentDefinition,
  mergeFormFieldsWithNewData,
  mergeArrays,
} from '../utils/utils';
import { FORM_STATUS } from '../constants';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { merge } from 'lodash';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';

/**
 * Disable the checkbox if the property is fx controlled and it will not be included while selectAll is called.
 * This is to prevent users from changing the state of fx controlled properties directly.
 * Instead, they should use the fx editor to manage these properties.
 *
 */

const ColumnMappingRow = ({
  column,
  onChange,
  onCheckboxChange,
  index,
  darkMode = false,
  disabled = false,
  sectionType,
}) => {
  if (!column) return null;

  const inputTypeOptions = getInputTypeOptions(darkMode);

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

  const shouldHideCheckbox = sectionType === 'isCustomField';

  return (
    <div className="tw-flex tw-items-center tw-w-full tw-py-3 tw-px-2 tw-border-b tw-border-border-lighter column-mapping-row">
      {/* Checkbox */}
      <div className={cx(`tw-w-6`, { 'tw-invisible': disabled || shouldHideCheckbox })}>
        <Checkbox checked={column.selected} onCheckedChange={onCheckboxChange} />
      </div>

      {/* Column Name and Type */}
      <div className="name-column tw-flex tw-items-center base-regular tw-justify-between">
        {column.key ? (
          <>
            <span className="base-regular">{column.key}</span>
            <span className="tw-ml-2 data-type">{column.dataType}</span>
          </>
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
          disabled={disabled}
        />
      </div>

      {/* Input Label */}
      <div className="type-column rows tw-flex-1 hide-border">
        <Input
          value={column.label}
          onChange={handleLabelChange}
          placeholder="Input label"
          size="small"
          disabled={disabled}
        />
      </div>

      {/* Mandatory Checkbox */}
      <div className={cx(`mandatory-column rows tw-flex tw-justify-end`, { 'tw-invisible': disabled })}>
        <Checkbox
          checked={isTrueValue(column.mandatory.value)}
          onCheckedChange={handleMandatoryChange}
          disabled={isMandatoryFxControlled} // Disable if fx controlled
        />
      </div>
    </div>
  );
};

const RenderSection = ({
  mappedColumns = [],
  setMappedColumns,
  darkMode,
  sectionType,
  sectionDisplayName,
  disabled = false,
}) => {
  const columnsArray = Array.isArray(mappedColumns) ? mappedColumns : [];

  const mandatorySettableColumns = columnsArray.filter((col) => !isPropertyFxControlled(col.mandatory));

  const isAllSelected = columnsArray.length > 0 ? columnsArray.every((col) => col.selected) : false;

  const isIntermediateSelected = !isAllSelected && columnsArray.some((col) => col.selected);

  const isAllSelectedMandatory =
    mandatorySettableColumns.length > 0
      ? mandatorySettableColumns.every((col) => isTrueValue(col.mandatory.value))
      : false;

  const isIntermediateMandatory =
    !isAllSelectedMandatory && mandatorySettableColumns.some((col) => isTrueValue(col.mandatory.value));

  const handleSelectAll = (checked) => {
    if (columnsArray.length > 0) {
      const updatedColumns = columnsArray.map((col) => ({
        ...col,
        selected: checked,
      }));
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
        if (col.name !== columnName) {
          return col;
        }

        return {
          ...col,
          selected: checked,
        };
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

  const shouldHideSelectAll = sectionType === 'isCustomField';

  const renderHeader = () => {
    return (
      <div className="tw-flex tw-items-center tw-w-full tw-py-[10px] tw-px-2 header-row column-mapping-row">
        <div className={cx(`tw-w-6 header-column`, { 'tw-invisible': disabled || shouldHideSelectAll })}>
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
          <div className={cx({ 'tw-invisible': disabled })}>
            <Checkbox
              checked={isAllSelectedMandatory || isIntermediateMandatory}
              onCheckedChange={handleSelectAllMandatory}
              intermediate={!isAllSelectedMandatory && isIntermediateMandatory}
            />
          </div>
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

      {renderHeader()}

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
              disabled={disabled}
              sectionType={sectionType}
            />
          ))
        ) : (
          <div className="tw-py-4 tw-text-center tw-text-gray-500">No {sectionDisplayName.toLowerCase()} available</div>
        )}
      </div>
    </div>
  );
};

const ColumnMappingComponent = ({
  isOpen,
  onClose,
  columns = [],
  darkMode = false,
  onSubmit,
  currentStatusRef,
  // refreshData,
  component,
  newResolvedJsonData,
  existingResolvedJsonData,
  source,
}) => {
  const { resolveReferences, getFormDataSectionData, getComponentDefinition, getFormFields } = useStore(
    (state) => ({
      resolveReferences: state.resolveReferences,
      getFormDataSectionData: state.getFormDataSectionData,
      getComponentDefinition: state.getComponentDefinition,
      getFormFields: state.getFormFields,
    }),
    shallow
  );

  const componentNameIdMapping = useStore((state) => state.modules.canvas.componentNameIdMapping, shallow);
  const queryNameIdMapping = useStore((state) => state.modules.canvas.queryNameIdMapping, shallow);
  const runQuery = useStore((state) => state.queryPanel.runQuery, shallow);

  const [isSaving, setIsSaving] = useState(false);
  const [groupedColumns, setGroupedColumns] = useState({});
  const [sectionTypes, setSectionTypes] = useState([]);
  const [refreshedColumns, setRefreshedColumns] = useState([]);

  const refreshData = async () => {
    currentStatusRef.current = FORM_STATUS.REFRESH_FIELDS;
    const res = extractAndReplaceReferencesFromString(source.value, componentNameIdMapping, queryNameIdMapping);
    const { allRefs, valueWithBrackets } = res;
    const queryId = allRefs[0]?.entityNameOrId;
    if (queryId && runQuery) {
      await runQuery(queryId, '', false, 'edit');
    }
    const resolvedValue = resolveReferences('canvas', valueWithBrackets);
    setRefreshedColumns(resolvedValue);
  };

  const buildColumns = (currentStatus = currentStatusRef.current) => {
    const formFields = getFormFields(component.id);
    const formFieldsWithComponentDefinition = mergeFieldsWithComponentDefinition(formFields, getComponentDefinition);

    if (currentStatus === FORM_STATUS.MANAGE_FIELDS) {
      const allColumnsFromJsonData = parseDataAndBuildFields(newResolvedJsonData);
      return mergeArrays(allColumnsFromJsonData, formFieldsWithComponentDefinition);
    } else if (currentStatus === FORM_STATUS.REFRESH_FIELDS) {
      const jsonDifferences = analyzeJsonDifferences(refreshedColumns, existingResolvedJsonData);
      const mergedJsonData = merge({}, existingResolvedJsonData, refreshedColumns);
      const parsedFields = parseDataAndBuildFields(mergedJsonData, jsonDifferences);
      const mergedFields = mergeFormFieldsWithNewData(formFieldsWithComponentDefinition, parsedFields);
      const enhancedFieldsWithComponentDefinition = mergeFieldsWithComponentDefinition(
        mergedFields,
        getComponentDefinition
      );
      return [
        ...enhancedFieldsWithComponentDefinition,
        ...formFieldsWithComponentDefinition.filter((f) => f.isCustomField),
      ];
    }
    return parseDataAndBuildFields(newResolvedJsonData || []);
  };

  const columnsToUse = buildColumns();

  // Group columns by section type on component load or when columns change
  useEffect(() => {
    const groupBySection = () => {
      // Use buildColumns if columns is empty or we need to rebuild
      // const columnsToUse = columns.length > 0 ? columns : buildColumns();

      const grouped = {};

      // Check if we're in GENERATE_FIELDS or REFRESH_FIELDS mode
      const isGenerateFieldsMode = currentStatusRef.current === FORM_STATUS.GENERATE_FIELDS;
      const isRefreshFormMode = currentStatusRef.current === FORM_STATUS.REFRESH_FIELDS;
      const shouldSelectByDefault = isGenerateFieldsMode || isRefreshFormMode;

      columnsToUse.forEach((col) => {
        let sectionType = 'existing';

        if (col.isNew) {
          sectionType = 'isNew';
        } else if (col.isRemoved) {
          sectionType = 'isRemoved';
        } else if (col.isCustomField) {
          sectionType = 'isCustomField';
        } else {
          sectionType = 'existing';
        }

        if (!grouped[sectionType]) {
          grouped[sectionType] = [];
        }

        // If in GENERATE_FIELDS or REFRESH_FIELDS mode, set columns as selected by default
        // For REFRESH_FIELDS, only select new fields by default
        if (
          shouldSelectByDefault &&
          sectionType !== 'isRemoved' &&
          (isGenerateFieldsMode || (isRefreshFormMode && sectionType === 'isNew'))
        ) {
          let updatedCol = { ...col };

          // Set selected as boolean true
          updatedCol.selected = true;

          grouped[sectionType].push(updatedCol);
        } else {
          grouped[sectionType].push(col);
        }
      });

      const preferredOrder = ['isNew', 'isRemoved', 'existing', 'isCustomField'];

      const types = preferredOrder.filter((type) => grouped[type] && grouped[type].length > 0);

      setGroupedColumns(grouped);
      setSectionTypes(types);
    };

    groupBySection();
  }, [
    columns,
    currentStatusRef,
    component.id,
    newResolvedJsonData,
    existingResolvedJsonData,
    JSON.stringify(columnsToUse),
  ]);

  const updateSectionColumns = (sectionType, updatedColumns) => {
    setGroupedColumns((prev) => ({
      ...prev,
      [sectionType]: updatedColumns,
    }));
  };

  const handleSubmit = () => {
    setIsSaving(true);
    const flatColumns = Object.entries(groupedColumns).flatMap(([_, columns]) => columns);
    const combinedColumns =
      currentStatusRef.current === FORM_STATUS.MANAGE_FIELDS
        ? flatColumns.map((column) => {
            if (!column.selected && column.componentId) {
              return {
                ...column,
                isRemoved: true,
              };
            } else return column;
          })
        : flatColumns.filter((column) => column.selected);

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

  const allSectionsEmpty = Object.values(groupedColumns).every((sectionColumns) => {
    return Array.isArray(sectionColumns) ? sectionColumns.every((col) => !col.selected) : true;
  });

  const modalBody = (
    <div className="tw-w-full column-mapping-modal-body-container">
      {sectionTypes.length > 0 && (
        <>
          {sectionTypes.map((sectionType) => {
            return (
              groupedColumns[sectionType]?.length > 0 && (
                <RenderSection
                  key={sectionType}
                  mappedColumns={groupedColumns[sectionType]}
                  setMappedColumns={(updatedColumns) => updateSectionColumns(sectionType, updatedColumns)}
                  darkMode={darkMode}
                  sectionType={sectionType}
                  sectionDisplayName={
                    currentStatusRef.current !== FORM_STATUS.GENERATE_FIELDS ? getSectionDisplayName(sectionType) : ''
                  }
                  disabled={sectionType === 'isRemoved'}
                />
              )
            );
          })}
        </>
      )}

      <div className="tw-flex tw-justify-between tw-items-center tw-mt-4">
        {currentStatusRef.current !== FORM_STATUS.GENERATE_FIELDS && (
          <Button fill={'#ACB2B9'} leadingIcon={'arrowdirectionloop'} variant="outline" onClick={refreshData}>
            Refresh data
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSaving || allSectionsEmpty}
          leadingIcon={currentStatusRef.current !== FORM_STATUS.GENERATE_FIELDS ? 'save' : 'plus'}
          isLoading={isSaving}
          loaderText={currentStatusRef.current !== FORM_STATUS.GENERATE_FIELDS ? 'Saving' : 'Generating'}
        >
          {currentStatusRef.current !== FORM_STATUS.GENERATE_FIELDS ? 'Save' : 'Generate form'}
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
              {currentStatusRef.current !== FORM_STATUS.GENERATE_FIELDS ? 'Manage fields' : 'Map columns'}
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
