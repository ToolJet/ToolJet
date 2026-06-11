import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button/Button';
import Checkbox from '@/components/ui/Checkbox/Index';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Modal from 'react-bootstrap/Modal';
import Dropdown from '@/components/ui/Dropdown/Index';
import Input from '@/components/ui/Input/Index';
import { getInputTypeOptions, isTrueValue, isPropertyFxControlled } from '../utils/utils';
import { FORM_STATUS } from '../constants';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import Loader from '@/ToolJetUI/Loader/Loader';
import { useColumnBuilder, useGroupedColumns, useCheckboxStates } from './hooks/useColumnMapping';
import { DropdownProvider } from '@/components/ui/Dropdown/DropdownProvider';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';

// Constants for section display names
const SECTION_DISPLAY_NAMES = {
  existing: 'Existing',
  isCustomField: 'Custom fields',
  isNew: 'New',
  isRemoved: 'Removed',
};

/**
 * Reusable editable icon component
 */
const EditableIcon = ({ darkMode }) => (
  <div className="tw-mr-2 editable-icon">
    <SolidIcon name="editable" width="12" height="12" fill={darkMode ? '#4C5155' : '#C1C8CD'} />
  </div>
);

/**
 * Modal header component
 */
const ModalHeader = ({ currentStatus, onClose }) => (
  <div className="column-mapping-modal-header tw-flex tw-p-4 tw-flex-col tw-items-start tw-gap-2 tw-self-stretch tw-border-b bg-white">
    <div className="tw-flex tw-justify-between tw-items-center tw-w-full" style={{ height: '28px' }}>
      <h4 className="text-default tw-font-ibmplex tw-font-medium tw-leading-5 tw-m-0">
        {currentStatus !== FORM_STATUS.GENERATE_FIELDS ? 'Manage fields' : 'Map columns'}
      </h4>
      <button className="tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer hover:tw-opacity-70" onClick={onClose}>
        <SolidIcon name="remove" width="16" height="16" fill="#6A727C" />
      </button>
    </div>
  </div>
);

/**
 * Modal footer component
 */
const ModalFooter = ({ currentStatus, refreshData, handleSubmit, isSaving, allSectionsEmpty }) => (
  <div
    className={`tw-flex ${
      currentStatus !== FORM_STATUS.GENERATE_FIELDS ? 'tw-justify-between' : 'tw-justify-end'
    } tw-items-center`}
  >
    {currentStatus !== FORM_STATUS.GENERATE_FIELDS && (
      <Button fill={'#ACB2B9'} leadingIcon={'arrowdirectionloop'} variant="outline" onClick={refreshData}>
        Refresh data
      </Button>
    )}
    <Button
      variant="primary"
      onClick={handleSubmit}
      disabled={isSaving || allSectionsEmpty}
      leadingIcon={currentStatus !== FORM_STATUS.GENERATE_FIELDS ? 'save' : 'plus'}
      isLoading={isSaving}
      loaderText={currentStatus !== FORM_STATUS.GENERATE_FIELDS ? 'Saving' : 'Generating'}
    >
      {currentStatus !== FORM_STATUS.GENERATE_FIELDS ? 'Save' : 'Generate form'}
    </Button>
  </div>
);

/**
 * Loader component
 */
const LoaderComponent = () => (
  <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-z-10">
    <Loader width="32" absolute={false} />
  </div>
);

/**
 * Disable the checkbox if the property is fx controlled and it will not be included while selectAll is called.
 * This is to prevent users from changing the state of fx controlled properties directly.
 * Instead, they should use the fx editor to manage these properties.
 *
 * Memoized for performance optimization when dealing with large datasets.
 */
const ColumnMappingRow = React.memo(
  ({ column, onChange, onCheckboxChange, index, darkMode = false, disabled = false, sectionType }) => {
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
  }
);

ColumnMappingRow.displayName = 'ColumnMappingRow';

const RenderSection = ({
  mappedColumns = [],
  setMappedColumns,
  darkMode,
  sectionType,
  sectionDisplayName,
  disabled = false,
}) => {
  const columnsArray = useMemo(() => {
    return Array.isArray(mappedColumns) ? mappedColumns : [];
  }, [mappedColumns]);

  const checkboxStates = useCheckboxStates(columnsArray);
  const parentRef = useRef(null);

  const { isAllSelected, isIntermediateSelected, isAllSelectedMandatory, isIntermediateMandatory } = checkboxStates;

  // Setup virtualizer for performance with large datasets
  const rowVirtualizer = useVirtualizer({
    count: columnsArray.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated row height in pixels
    overscan: 10, // Render 10 items outside viewport for smooth scrolling
  });

  const handleSelectAll = useCallback(
    (checked) => {
      if (columnsArray.length > 0) {
        const updatedColumns = columnsArray.map((col) => ({
          ...col,
          selected: checked,
        }));
        setMappedColumns(updatedColumns);
      }
    },
    [columnsArray, setMappedColumns]
  );

  const handleSelectAllMandatory = useCallback(
    (checked) => {
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
    },
    [columnsArray, setMappedColumns]
  );

  const handleColumnSelect = useCallback(
    (columnName, checked) => {
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
    },
    [columnsArray, setMappedColumns]
  );

  const handleColumnChange = useCallback(
    (columnName, changes) => {
      if (columnsArray.length > 0) {
        const updatedColumns = columnsArray.map((col) => (col.name === columnName ? { ...col, ...changes } : col));
        setMappedColumns(updatedColumns);
      }
    },
    [columnsArray, setMappedColumns]
  );

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
          <EditableIcon darkMode={darkMode} />
          <span className="text-default small-medium">Mapped to</span>
        </div>
        <div className="type-column tw-flex-1 header-column tw-flex">
          <EditableIcon darkMode={darkMode} />
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
    <div className="tw-w-full column-mapping-modal-body-content">
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

      <div>
        {columnsArray.length > 0 ? (
          // Use virtualization for large datasets (lowered threshold to 20 for testing)
          columnsArray.length > 20 ? (
            <div
              ref={parentRef}
              className="tw-max-h-[300px] tw-overflow-y-auto tw-w-full"
              style={{
                contain: 'strict',
                height: '300px', // Fixed height for virtualization
              }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                  width: '100%',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const column = columnsArray[virtualItem.index];
                  if (!column) return null;

                  return (
                    <div
                      key={`${column.name}-${virtualItem.index}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      data-index={virtualItem.index}
                      ref={rowVirtualizer.measureElement}
                    >
                      <ColumnMappingRow
                        column={column}
                        onCheckboxChange={(checked) => handleColumnSelect(column.name, checked)}
                        onChange={(changes) => handleColumnChange(column.name, changes)}
                        index={virtualItem.index}
                        darkMode={darkMode}
                        disabled={disabled}
                        sectionType={sectionType}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // For smaller datasets, use regular rendering
            columnsArray.map((column, index) => (
              <ColumnMappingRow
                key={column.name}
                column={column}
                onCheckboxChange={(checked) => handleColumnSelect(column.name, checked)}
                onChange={(changes) => handleColumnChange(column.name, changes)}
                index={index}
                darkMode={darkMode}
                disabled={disabled}
                sectionType={sectionType}
              />
            ))
          )
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
  darkMode = false,
  onSubmit,
  currentStatusRef,
  component,
  newResolvedJsonData,
  existingResolvedJsonData,
  source,
  isDataLoading,
}) => {
  const { resolveReferences, getComponentDefinition, getFormFields } = useStore(
    (state) => ({
      resolveReferences: state.resolveReferences,
      getComponentDefinition: state.getComponentDefinition,
      getFormFields: state.getFormFields,
    }),
    shallow
  );

  const componentNameIdMapping = useStore((state) => state.modules.canvas.componentNameIdMapping, shallow);
  const queryNameIdMapping = useStore((state) => state.modules.canvas.queryNameIdMapping, shallow);
  const runQuery = useStore((state) => state.queryPanel.runQuery, shallow);

  const [isSaving, setIsSaving] = useState(false);
  const [refreshedColumns, setRefreshedColumns] = useState([]);
  const [showLoader, setShowLoader] = useState(false);
  const bodyContainerRef = useRef(null);
  const lastBodyHeightRef = useRef(60);

  useEffect(() => {
    setShowLoader(isDataLoading);
  }, [isDataLoading]);

  // Track body height when content is loaded
  useEffect(() => {
    if (!showLoader && bodyContainerRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (bodyContainerRef.current) {
          const height = Math.min(bodyContainerRef.current.scrollHeight, 500);
          if (height > 0) {
            lastBodyHeightRef.current = height;
          }
        }
      }, 0);
    }
  }, [showLoader, groupedColumns]);

  const currentStatus = currentStatusRef.current;

  const columnsToUse = useColumnBuilder(
    component,
    currentStatus,
    newResolvedJsonData,
    existingResolvedJsonData,
    refreshedColumns?.length === 0 || Object.keys(refreshedColumns).length === 0
      ? newResolvedJsonData
      : refreshedColumns,
    getFormFields,
    getComponentDefinition
  );

  const { groupedColumns, sectionTypes, updateSectionColumns } = useGroupedColumns(columnsToUse, currentStatus);

  const refreshData = useCallback(async () => {
    setShowLoader(true);
    currentStatusRef.current = FORM_STATUS.REFRESH_FIELDS;
    const res = extractAndReplaceReferencesFromString(source.value, componentNameIdMapping, queryNameIdMapping);
    const { allRefs, valueWithBrackets } = res;

    const queryRefs = allRefs
      .filter((ref) => ref.entityType === 'queries')
      .filter((ref, index, self) => index === self.findIndex((r) => r.entityNameOrId === ref.entityNameOrId));

    await Promise.all(
      queryRefs.map(async (ref) => {
        const queryId = ref.entityNameOrId;
        await runQuery(queryId, '', false, 'edit');
      })
    );

    const resolvedValue = resolveReferences('canvas', valueWithBrackets);
    setRefreshedColumns(resolvedValue);
    setShowLoader(false);
  }, [source.value, componentNameIdMapping, queryNameIdMapping, runQuery, resolveReferences, currentStatusRef]);

  const handleSubmit = useCallback(() => {
    setIsSaving(true);
    const flatColumns = Object.entries(groupedColumns)
      .flatMap(([, columns]) => columns)
      .filter((col) => !col.isCustomField);
    const combinedColumns = flatColumns.map((column) => {
      if (!column.selected) {
        return {
          ...column,
          isRemoved: true,
        };
      } else return column;
    });

    onSubmit?.(combinedColumns);
  }, [groupedColumns, onSubmit]);

  // Get display name for section type
  const getSectionDisplayName = useCallback((sectionType) => {
    return SECTION_DISPLAY_NAMES[sectionType] || '';
  }, []);

  const allSectionsEmpty = useMemo(() => {
    return Object.values(groupedColumns).every((sectionColumns) => {
      return Array.isArray(sectionColumns) ? sectionColumns.every((col) => !col.selected) : true;
    });
  }, [groupedColumns]);

  const modalBody = (
    <>
      <div
        ref={bodyContainerRef}
        className="tw-w-full column-mapping-modal-body-container tw-max-h-[500px] tw-overflow-y-auto tw-p-4 tw-pb-0 tw-relative"
        style={showLoader && lastBodyHeightRef.current ? { minHeight: `${lastBodyHeightRef.current}px` } : undefined}
      >
        {showLoader && <LoaderComponent />}

        {!showLoader && (
          <div>
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
                      currentStatus !== FORM_STATUS.GENERATE_FIELDS ? getSectionDisplayName(sectionType) : ''
                    }
                    disabled={sectionType === 'isRemoved'}
                  />
                )
              );
            })}
          </div>
        )}
      </div>
      <div className="tw-p-4 tw-border-t tw-border-border-lighter">
        <ModalFooter
          currentStatus={currentStatus}
          refreshData={refreshData}
          handleSubmit={handleSubmit}
          isSaving={isSaving}
          allSectionsEmpty={allSectionsEmpty}
        />
      </div>
    </>
  );

  return (
    <Modal show={isOpen} onHide={onClose} size="lg">
      <DropdownProvider>
        <ModalHeader currentStatus={currentStatus} onClose={onClose} />
        <div className="column-mapping-modal-body">{modalBody}</div>
      </DropdownProvider>
    </Modal>
  );
};

export default ColumnMappingComponent;
