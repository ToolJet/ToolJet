import React, { useState, useContext, useEffect, useMemo } from 'react';
import cx from 'classnames';
import Select, { components } from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import defaultStyles from '@/_ui/Select/styles';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { shallow } from 'zustand/shallow';
import { useTjdbStore, useTjdbActions } from '../_stores/tjdbStore';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel, renderDatatypeIcon } from '../constants';
import Drawer from '@/_ui/Drawer';
import ForeignKeyTableForm from './ForeignKeyTableForm';
import WarningInfo from '../Icons/Edit-information.svg';
import Information from '@/_ui/Icon/solidIcons/Information';
import CheckCircle from '@/_ui/Icon/solidIcons/CheckCircle';
import Warning from '@/_ui/Icon/solidIcons/Warning';
import Spinner from '@/_ui/Spinner';
import { isEmpty } from 'lodash';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import ForeignKeyRelationIcon from '../Icons/Fk-relation.svg';
import EditIcon from '../Icons/EditColumn.svg';
import { ToolTip } from '@/_components/ToolTip';
import ForeignKeyIndicator from '../Icons/ForeignKeyIndicator.svg';
import ArrowRight from '../Icons/ArrowRight.svg';
import DropDownSelect from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import Skeleton from 'react-loading-skeleton';
import Tick from '@/_ui/Icon/bulkIcons/Tick';
import DateTimePicker from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DateTimePicker';
import { getLocalTimeZone, timeZonesWithOffsets } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/util';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';
import Switch from '@/AppBuilder/CodeBuilder/Elements/Switch';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import useMigrationModal from '../MigrationConfirmModal/useMigrationModal';
import { castFor, buildCastabilityQuery, allowedTargets, blockedReason, buildTypeChangeSql } from '../columnTypeChange';

// Info boxes for the cast report and the omitted-conversions notice, shaped to match the existing
// `.edit-warning-info` box above (Forms/styles.scss) so all the drawer's callouts read as one
// family: full 1px border, tw-rounded-md (--radius-md is literally 6px, matching that box), icon +
// text row.
// Arbitrary-value classes, not the theme's compound color keys directly (tw-text-warning etc. are
// not real generated utilities here - this config's colors are extended as flat compound keys like
// 'text-warning' with no separate textColor/borderColor override, so Tailwind would only emit
// tw-text-text-warning for that key). tw-*-[var(--token)] is the pattern already used throughout
// this codebase (e.g. HomePage.jsx, EventManager.jsx) to sidestep that.
const INFO_BOX_TONE_CLASSES = {
  accent: 'tw-border-[var(--border-accent-weak)] tw-bg-[var(--background-accent-weak)] tw-text-[var(--text-accent)]',
  success:
    'tw-border-[var(--border-success-weak)] tw-bg-[var(--background-success-weak)] tw-text-[var(--text-success)]',
  danger: 'tw-border-[var(--border-danger-weak)] tw-bg-[var(--background-error-weak)] tw-text-[var(--text-danger)]',
};

const infoBoxClass = (tone) =>
  cx('tw-flex tw-items-start tw-gap-2 tw-rounded-md tw-border tw-p-2 tw-text-base', INFO_BOX_TONE_CLASSES[tone]);

const ColumnForm = ({
  onClose,
  selectedColumn,
  setColumns,
  rows,
  isEditColumn = true,
  referencedColumnDetails,
  setReferencedColumnDetails,
  initiator,
}) => {
  const nullValue = selectedColumn?.constraints_type?.is_not_null ?? false;
  const uniqueConstraintValue = selectedColumn?.constraints_type?.is_unique ?? false;

  const {
    organizationId,
    selectedTable,
    handleRefetchQuery,
    setForeignKeys,
    foreignKeys,
    configurations,
    setConfigurations,
  } = useContext(TooljetDatabaseContext);
  const { queryFilters, sortFilters, pageCount, pageSize } = useTjdbStore(
    (state) => ({
      queryFilters: state.queryFilters,
      sortFilters: state.sortFilters,
      pageCount: state.pageCount,
      pageSize: state.pageSize,
    }),
    shallow
  );
  const selectedEnvironment = useTjdbStore((state) => state.selectedEnvironment);
  const { fetchTableMetadata } = useTjdbActions();

  const [columnName, setColumnName] = useState(selectedColumn?.Header);
  const { runMigration, modal: migrationModal } = useMigrationModal();
  const [defaultValue, setDefaultValue] = useState(selectedColumn?.column_default);
  // Holds the react-select option (`{ value, label, ... }`), not a bare type string - matches what
  // `handleTypeChange` receives from `Select`'s `onChange` and what every other read site here
  // already expected (`dataType?.value`) even before the dropdown could ever produce one.
  const [dataType, setDataType] = useState(dataTypes.find((type) => type.value === selectedColumn?.dataType) ?? null);
  const [isNotNull, setIsNotNull] = useState(nullValue);
  const [createForeignKeyInEdit, setCreateForeignKeyInEdit] = useState(false);
  const [isForeignKey, setIsForeignKey] = useState(false);
  const [isUniqueConstraint, setIsUniqueConstraint] = useState(uniqueConstraintValue);
  const [isForeignKeyDraweOpen, setIsForeignKeyDraweOpen] = useState(false);
  const [selectedForeignkeyIndex, setSelectedForeignKeyIndex] = useState([]);
  const [sourceColumn, setSourceColumn] = useState([]);
  const [targetTable, setTargetTable] = useState([]);
  const [targetColumn, setTargetColumn] = useState([]);
  const [onDelete, setOnDelete] = useState([]);
  const [onUpdate, setOnUpdate] = useState([]);
  // Advisory only - Postgres' own ALTER decides whether the cast succeeds. This exists because its
  // error names one arbitrary bad value and no count.
  const [castReport, setCastReport] = useState(null);
  const isTimestamp = dataType?.value === 'timestamp with time zone';
  const isJsonbColumnType = dataType?.value === 'jsonb';
  const { Option } = components;

  //  this is for DropDownDetails component which is react select
  const [foreignKeyDefaultValue, setForeignKeyDefaultValue] = useState(() => {
    if (['integer', 'bigint', 'double precision'].includes(dataType?.value)) {
      return {
        value: parseInt(selectedColumn?.column_default),
        label: parseInt(selectedColumn?.column_default),
      };
    } else if (dataType?.value === 'booolean') {
      return {
        value: selectedColumn?.column_default === 'true' ? true : false,
        label: selectedColumn?.column_default === 'true' ? true : false,
      };
    } else {
      return {
        value: selectedColumn?.column_default,
        label: selectedColumn?.column_default,
      };
    }
  });

  const [foreignKeyDetails, setForeignKeyDetails] = useState([]);

  // Add function to validate default value
  const validateDefaultValue = async () => {
    if (!isMatchingForeignKeyColumn(selectedColumn?.Header)) return;

    try {
      const referencedColumns = foreignKeys.find((item) => item.column_names[0] === selectedColumn?.Header);

      if (!referencedColumns?.referenced_column_names?.length) {
        setForeignKeyDefaultValue({
          value: '',
          label: '',
        });
        setDefaultValue('');
        return;
      }

      const selectQuery = new PostgrestQueryBuilder();
      selectQuery.select(referencedColumns.referenced_column_names[0]);
      selectQuery.eq(referencedColumns.referenced_column_names[0], defaultValue);

      const query = selectQuery.url.toString();

      const { data = [], error } = await tooljetDatabaseService.findOne(referencedColumns.referenced_table_id, query);

      if (error) {
        toast.error(error?.message ?? `Failed to validate default value`);
        setForeignKeyDefaultValue({
          value: '',
          label: '',
        });
        setDefaultValue('');
        return;
      }

      if (data.length === 0) {
        setForeignKeyDefaultValue({
          value: '',
          label: '',
        });
        setDefaultValue('');
      }
    } catch (error) {
      console.error('Error validating default value:', error);
      setForeignKeyDefaultValue({
        value: '',
        label: '',
      });
      setDefaultValue('');
    }
  };

  // Add useEffect to validate on mount
  useEffect(() => {
    if (isMatchingForeignKeyColumn(selectedColumn?.Header) && defaultValue) {
      validateDefaultValue();
    }
  }, []);

  useEffect(() => {
    toast.dismiss();
    setForeignKeyDetails(
      foreignKeys?.map((item) => {
        return {
          column_names: item.column_names,
          referenced_table_name: item.referenced_table_name,
          referenced_table_id: item.referenced_table_id,
          referenced_column_names: item.referenced_column_names,
          on_delete: item.on_delete,
          on_update: item.on_update,
        };
      })
    );
  }, []);

  useEffect(() => {
    if (dataType?.value === 'boolean') {
      setIsUniqueConstraint(false);
    }
  }, [dataType]);

  useEffect(() => {
    setForeignKeyDetails(
      foreignKeys?.map((item) => {
        return {
          column_names: item.column_names,
          referenced_table_name: item.referenced_table_name,
          referenced_table_id: item.referenced_table_id,
          referenced_column_names: item.referenced_column_names,
          on_delete: item.on_delete,
          on_update: item.on_update,
        };
      })
    );
  }, [foreignKeys]);

  const columns = {
    column_name: columnName,
    data_type: dataType?.value,
    constraints_type: {
      is_not_null: isNotNull,
      is_primary_key: selectedColumn.is_primary_key,
      is_unique: isUniqueConstraint,
    },
    dataTypeDetails: dataTypes.filter((item) => item.value === dataType?.value),
    column_default: defaultValue,
  };

  const columnUuid = configurations?.columns?.column_names?.[selectedColumn?.Header];
  const columnConfigurations = configurations?.columns?.configurations?.[columnUuid] || {};
  const [timezone, setTimezone] = useState(columnConfigurations?.timezone || getLocalTimeZone());

  const existingReferencedTableName = foreignKeys[selectedForeignkeyIndex]?.referenced_table_name;
  const existingReferencedColumnName = foreignKeys[selectedForeignkeyIndex]?.referenced_column_names[0];
  const currentReferencedTableName = targetTable?.value;
  const currentReferencedColumnName = targetColumn?.value;

  const handleCreateForeignKeyinEditMode = () => {
    const data = [
      {
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      },
    ];

    runMigration({
      titlePlaceholder: `Add foreign key on "${selectedTable.table_name}"`,
      changes: [{ type: '+', label: `Add foreign key on "${selectedTable.table_name}"` }],
      tableId: selectedTable.id,
      showSqlEditor: true,
      run: (migrationName) =>
        tooljetDatabaseService.createForeignKey(organizationId, selectedTable.table_name, data, migrationName),
      onSuccess: async () => {
        await fetchMetaDataApi();
        handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
        toast.success(`Foreign key created successfully`);
        setCreateForeignKeyInEdit(false);
        setIsForeignKeyDraweOpen(false);
      },
    });
  };

  const [defaultValueLength] = useState(defaultValue?.length);
  const darkDisabledBackground = '#1f2936';
  const lightDisabledBackground = '#f4f6fa';
  const lightFocussedBackground = '#fff';
  const darkFocussedBackground = 'transparent';
  const lightBackground = '#fff';
  const darkBackground = 'transparent';

  const darkBorderHover = '#dadcde';
  const lightBorderHover = '#dadcde';

  const darkDisabledBorder = '#3a3f42';
  const lightDisabledBorder = '#dadcde';
  const lightFocussedBorder = '#dadcde';
  const darkFocussedBorder = '#3e63dd !important';
  const lightBorder = '#dadcde';
  const darkBorder = '#3a3f42 !important';
  const dropdownContainerWidth = '360px';

  const CustomSelectOption = (props) => (
    <Option {...props}>
      <div className="selected-dropdownStyle d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center justify-content-start">
          <div>{props.data.icon}</div>
          <span className="dataType-dropdown-label">{props.data.label}</span>
          <span className="dataType-dropdown-value">{props.data.name}</span>
        </div>
        <div>
          {dataType?.value === props.data.value ? (
            <div>
              <Tick width="16" height="16" />
            </div>
          ) : null}
        </div>
      </div>
    </Option>
  );

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const customStyles = tjdbDropdownStyles(
    darkMode,
    darkDisabledBackground,
    lightDisabledBackground,
    lightFocussedBackground,
    darkFocussedBackground,
    lightBackground,
    darkBackground,
    darkBorderHover,
    lightBorderHover,
    darkDisabledBorder,
    lightDisabledBorder,
    lightFocussedBorder,
    darkFocussedBorder,
    lightBorder,
    darkBorder,
    dropdownContainerWidth
  );

  const handleTypeChange = (value) => {
    setDataType(value);
  };

  const fetchMetaDataApi = async () => {
    const metadata = await fetchTableMetadata(organizationId, selectedTable.table_name);
    if (!metadata) return;
    setConfigurations(metadata.configurations);
    if (metadata.columns.length > 0) setColumns(metadata.columns);
    setForeignKeys([...metadata.foreignKeys]);
  };

  const onCloseForeignKeyDrawer = () => {
    setIsForeignKeyDraweOpen(false);
    setCreateForeignKeyInEdit(false);
    setSourceColumn([]);
    setTargetTable([]);
    setTargetColumn([]);
    setOnDelete([]);
    setOnUpdate([]);
  };

  const getForeignKeyColumnDetails = foreignKeys?.filter((item) => item.column_names[0] === selectedColumn?.Header); // this is for getting current foreign key column

  const currentDataType = selectedColumn?.dataType;
  // The serial and foreign-key locks mirror real backend gates in applyEditColumn (assertStructuredTypeChangeAllowed's
  // nextval check, and fetchForeignKeys). The primary-key lock is UI-only, not backend-enforced: a PK's type is
  // conceptually load-bearing, so it is withheld here defensively.
  const isTypeChangeLocked =
    currentDataType === 'serial' || selectedColumn?.constraints_type?.is_primary_key === true || isForeignKey === true;

  // Default-deny: only the pairs in CAST_TIERS are offerable, plus the column's own current type so
  // the dropdown can show what it is.
  const typeOptions = React.useMemo(() => {
    if (isTypeChangeLocked) return dataTypes.filter((type) => type.value === currentDataType);
    const reachable = new Set(allowedTargets(currentDataType).map(({ to }) => to));
    return dataTypes.filter((type) => type.value === currentDataType || reachable.has(type.value));
  }, [currentDataType, isTypeChangeLocked]);

  // A type that isn't offered would otherwise just be silently missing from the dropdown, leaving a
  // user who wants `double precision -> integer` with no idea why. Deduplicated, since several
  // omitted types can share one reason.
  const omittedReasons = React.useMemo(() => {
    if (isTypeChangeLocked) return [];
    const offered = new Set(typeOptions.map((type) => type.value));
    const reasons = dataTypes
      .filter((type) => !offered.has(type.value))
      .map((type) => blockedReason(currentDataType, type.value))
      .filter(Boolean);
    return [...new Set(reasons)];
  }, [typeOptions, currentDataType, isTypeChangeLocked]);

  const handleEdit = () => {
    const isTypeChanged = !!dataType?.value && dataType.value !== selectedColumn?.dataType;
    const hasChange =
      columnName !== selectedColumn?.Header ||
      defaultValue?.length > 0 ||
      defaultValue !== selectedColumn?.column_default ||
      nullValue !== isNotNull ||
      uniqueConstraintValue !== isUniqueConstraint ||
      !isForeignKey ||
      isTypeChanged;

    const finish = () => {
      fetchMetaDataApi();
      handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
      toast.success(`Column edited successfully`);
      onClose && onClose();
    };

    // Nothing actually changed - close without a request, same as before this modal existed.
    if (!hasChange) {
      finish();
      return;
    }

    const isRenamed = columnName !== selectedColumn?.Header;
    const cast = isTypeChanged ? castFor(selectedColumn?.dataType, dataType.value) : null;
    // A lossless widening cast is the only one `edit_column` performs itself; every other supported
    // cast needs a USING clause, which is generated into the SQL step below and recorded as a raw
    // SQL migration by useMigrationModal after the structured request succeeds.
    const isStructuredTypeChange = cast?.tier === 'lossless';
    const needsGeneratedSql = !!cast && !isStructuredTypeChange;

    runMigration({
      titlePlaceholder: isRenamed
        ? `Rename column "${selectedColumn?.Header}" to "${columnName}"`
        : `Edit column "${selectedColumn?.Header}"`,
      changes: [
        {
          type: '✎',
          label: isRenamed
            ? `Rename column "${selectedColumn?.Header}" to "${columnName}"`
            : `Edit column "${selectedColumn?.Header}"`,
        },
        ...(isTypeChanged
          ? [
              {
                type: '✎',
                label: `Change "${selectedColumn?.Header}" from ${selectedColumn?.dataType} to ${dataType.value}`,
              },
            ]
          : []),
      ],
      tableId: selectedTable.id,
      showSqlEditor: true,
      // The structured request runs first (see useMigrationModal's run sequence), so if this save
      // also renames the column, the cast has to name the column by its new name.
      ...(needsGeneratedSql && {
        initialSql: buildTypeChangeSql({
          columnName: isRenamed ? columnName : selectedColumn?.Header,
          targetType: dataType.value,
          hasDefault: !!defaultValue || !!selectedColumn?.column_default,
        }),
      }),
      run: (migrationName) => {
        const reqConfigurations = {};
        if (selectedColumn?.dataType === 'timestamp with time zone') reqConfigurations['timezone'] = timezone;

        const colDetails = {
          column: {
            column_name: selectedColumn?.Header,
            // Only a lossless cast travels in the structured request. For every other cast this
            // deliberately resends the *current* type, so `edit_column` applies the rename,
            // default and constraints while the generated SQL step performs the cast.
            data_type: isStructuredTypeChange ? dataType.value : selectedColumn?.dataType,
            ...(selectedColumn?.dataType !== 'serial' && { column_default: defaultValue }),
            constraints_type: {
              is_not_null: isNotNull,
              is_primary_key: selectedColumn?.constraints_type?.is_primary_key ?? false,
              is_unique: isUniqueConstraint,
            },
            configurations: { ...columnConfigurations, ...reqConfigurations },
            ...(isRenamed ? { new_column_name: columnName } : {}),
          },
          ...(isForeignKey === false && { foreignKeyIdToDelete: getForeignKeyColumnDetails[0]?.constraint_name }),
          ...(migrationName && { migration_name: migrationName }),
        };
        return tooljetDatabaseService.updateColumn(organizationId, selectedTable.table_name, colDetails);
      },
      onSuccess: finish,
    });
  };

  const toolTipPlacementStyle = {
    width: '126px',
  };

  const handleDeleteForeignKeyColumn = () => {
    const id = foreignKeys[selectedForeignkeyIndex]?.constraint_name;
    runMigration({
      titlePlaceholder: `Remove foreign key on "${selectedTable.table_name}"`,
      changes: [{ type: '-', label: `Remove foreign key on "${selectedTable.table_name}"` }],
      tableId: selectedTable.id,
      showSqlEditor: false,
      run: (migrationName) =>
        tooljetDatabaseService.deleteForeignKey(organizationId, selectedTable.table_name, id, migrationName),
      onSuccess: () => {
        fetchMetaDataApi();
        handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
        setIsForeignKey(false);
        setForeignKeyDetails([]);
        onCloseForeignKeyDrawer();
        toast.success(`Foreign key deleted successfully`);
      },
    });
  };

  const handleEditForeignKey = () => {
    const id = foreignKeys[selectedForeignkeyIndex]?.constraint_name;
    const data = [
      {
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      },
    ];

    runMigration({
      titlePlaceholder: `Edit foreign key on "${selectedTable.table_name}"`,
      changes: [{ type: '✎', label: `Edit foreign key on "${selectedTable.table_name}"` }],
      tableId: selectedTable.id,
      showSqlEditor: true,
      // Folded in from the old "Change in foreign key relation" ConfirmDialog.
      banner:
        newChangesInForeignKey.length > 0 ? (
          <div className="mb-3">
            <div className={cx('form-label', { 'form-label-light': !darkMode })}>Change in foreign key relation</div>
            <div className="tw-text-muted tw-mb-2" style={{ fontSize: '13px' }}>
              Updating the foreign key relation will drop the current constraint and add the new one. This will also
              replace the default value set in the target table columns with those of the source table.
            </div>
          </div>
        ) : null,
      run: (migrationName) =>
        tooljetDatabaseService.editForeignKey(organizationId, selectedTable.table_name, id, data, migrationName),
      onSuccess: () => {
        fetchMetaDataApi();
        handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
        onCloseForeignKeyDrawer();
        toast.success(`Foreign key edited successfully`);
      },
    });
  };

  const changesInForeignKey = () => {
    const newForeignKeyDetails = [];

    if (
      currentReferencedColumnName !== existingReferencedColumnName ||
      currentReferencedTableName !== existingReferencedTableName
    ) {
      const newDetail = {};
      if (currentReferencedColumnName !== existingReferencedColumnName) {
        newDetail.columnName = currentReferencedColumnName;
      }
      if (currentReferencedTableName !== existingReferencedTableName) {
        newDetail.tableName = currentReferencedTableName;
      }
      newForeignKeyDetails.push(newDetail);
    }

    return newForeignKeyDetails;
  };

  const tzOptions = useMemo(() => timeZonesWithOffsets(), []);

  const tzDictionary = useMemo(() => {
    const dict = {};
    tzOptions.forEach((option) => {
      dict[option.value] = option;
    });
    return dict;
  }, []);

  const newChangesInForeignKey = changesInForeignKey();

  const referenceTableDetails = referencedColumnDetails.map((item) => {
    const [key, value] = Object.entries(item);
    return {
      label: key[1],
      value: key[1],
    };
  });

  const openEditForeignKey = (sourceColumnName) => {
    setIsForeignKeyDraweOpen(true);
    const existingForeignKeyColumn = foreignKeyDetails?.filter((obj) => obj.column_names[0] === sourceColumnName);
    const existingForeignKeyIndex = foreignKeyDetails?.findIndex((obj) => obj.column_names[0] === sourceColumnName);
    setSelectedForeignKeyIndex(existingForeignKeyIndex);
    setSourceColumn({
      value: existingForeignKeyColumn[0]?.column_names[0],
      label: existingForeignKeyColumn[0]?.column_names[0],
      dataType: selectedColumn?.dataType,
    });
    setTargetTable({
      value: existingForeignKeyColumn[0]?.referenced_table_name,
      label: existingForeignKeyColumn[0]?.referenced_table_name,
    });
    setTargetColumn({
      value: existingForeignKeyColumn[0]?.referenced_column_names[0],
      label: existingForeignKeyColumn[0]?.referenced_column_names[0],
      dataType: selectedColumn?.dataType,
    });
    setOnDelete({
      value: existingForeignKeyColumn[0]?.on_delete,
      label: existingForeignKeyColumn[0]?.on_delete,
    });
    setOnUpdate({
      value: existingForeignKeyColumn[0]?.on_update,
      label: existingForeignKeyColumn[0]?.on_update,
    });
  };

  useEffect(() => {
    const existingForeignKeyIndex = foreignKeyDetails?.findIndex((obj) => obj.column_names[0] === columnName);
    setSelectedForeignKeyIndex(existingForeignKeyIndex);
    isMatchingForeignKeyColumn(columnName) ? setIsForeignKey(true) : setIsForeignKey(false);
  }, []);

  function isMatchingForeignKeyColumn(columnName) {
    return foreignKeys.some((foreignKey) => foreignKey.column_names[0] === columnName);
  }

  function isMatchingForeignKeyColumnDetails(columnName) {
    const matchingColumn = foreignKeyDetails.find((foreignKey) => foreignKey.column_names[0] === columnName);
    return matchingColumn;
  }

  const [disabledSaveButton, setDisabledSaveButton] = useState(true);

  useEffect(() => {
    setDisabledSaveButton(columnName === '');
  }, [columnName]);

  useEffect(() => {
    const shouldDisableForNullValue = dataType?.value !== 'serial' && isNotNull === true && isEmpty(defaultValue);
    setDisabledSaveButton(shouldDisableForNullValue);
  }, [isNotNull, defaultValue, dataType]);

  useEffect(() => {
    const currentType = selectedColumn?.dataType;
    const targetType = dataType?.value;
    const cast = targetType && currentType !== targetType ? castFor(currentType, targetType) : null;

    if (!cast || cast.tier !== 'may_fail') {
      setCastReport(null);
      return;
    }

    if (!selectedEnvironment?.id) return;

    const query = buildCastabilityQuery({
      tableName: selectedTable.table_name,
      columnName: selectedColumn?.Header,
      probe: cast.probe,
    });

    if (!query) {
      setCastReport({ status: 'uncheckable' });
      return;
    }

    let cancelled = false;
    setCastReport({ status: 'loading' });

    tooljetDatabaseService
      .sqlExecution(organizationId, selectedTable.id, { sql: query, environment_id: selectedEnvironment.id })
      .then(({ error, data }) => {
        if (cancelled) return;

        // A SQL-level failure comes back as a 2xx body shaped { result: { status: 'failed', ... } },
        // so the adapter's own `error` stays unset - checking only `error` reads a failed probe as
        // "every value converts cleanly", which is the one wrong answer this report must never give.
        const result = data?.result;
        if (error || result?.status === 'failed') {
          const message =
            error?.message ??
            [result?.error_message, result?.data?.message].filter(Boolean).join(': ') ??
            'Could not check existing values';
          setCastReport({ status: 'error', message });
          return;
        }

        // Raw array since commit 026740b242 ("return raw array for join_tables and sql_execution").
        const rows = Array.isArray(result?.data) ? result.data : [];
        setCastReport({
          status: 'done',
          values: rows.slice(0, 20).map((row) => row[selectedColumn?.Header]),
          truncated: rows.length > 20,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [dataType, selectedColumn, selectedTable, selectedEnvironment, organizationId]);

  const handleInputError = (bool = false) => {
    setDisabledSaveButton(bool);
  };

  const codehinterCallback = React.useCallback(() => {
    return (
      <CodeHinter
        type="tjdbHinter"
        inEditor={false}
        initialValue={defaultValue ? JSON.stringify(defaultValue) : ''}
        lang="javascript"
        onChange={(value) => {
          const [_, __, resolvedValue] = resolveReferences(`{{${value}}}`);
          setDefaultValue(resolvedValue);
        }}
        componentName={`{} ${columnName}`}
        errorCallback={handleInputError}
        lineNumbers={false}
        placeholder="{}"
        columnName={columnName}
        showErrorMessage={true}
      />
    );
  }, [defaultValue]);

  return (
    <>
      <div className="drawer-card-wrapper ">
        <div className="drawer-card-title ">
          <h3 className="primaryKey-indication-container" data-cy="create-new-column-header">
            Edit column
            {foreignKeys.length > 0 && foreignKeys[selectedForeignkeyIndex]?.column_names[0] === columnName && (
              <ToolTip
                message={
                  <div>
                    <span>Foreign key relation</span>
                    <div className="d-flex align-item-center justify-content-between mt-2 custom-tooltip-style">
                      <span>{foreignKeys[selectedForeignkeyIndex]?.column_names[0]}</span>
                      <ArrowRight />
                      <span>{`${foreignKeys[selectedForeignkeyIndex]?.referenced_table_name}.${foreignKeys[selectedForeignkeyIndex]?.referenced_column_names[0]}`}</span>
                    </div>
                  </div>
                }
                placement="right"
                tooltipClassName="tootip-table"
              >
                <div>
                  <span className="primaryKey-indication">
                    <ForeignKeyIndicator />
                  </span>
                </div>
              </ToolTip>
            )}
            {selectedColumn.constraints_type.is_primary_key === true && (
              <ToolTip
                message={'Primary key'}
                placement="bottom"
                tooltipClassName="primary-key-tooltip"
                show={selectedColumn.constraints_type.is_primary_key === true}
              >
                <span className="primaryKey-indication">
                  <SolidIcon name="primarykey" />
                </span>
              </ToolTip>
            )}
          </h3>
        </div>

        <div className="card-body edit-column-body">
          <div className="edit-warning-info mb-3">
            <div className="edit-warning-icon">
              <WarningInfo />
            </div>
            <span className="edit-warning-text">
              Editing the column could break queries and apps connected with this table.
            </span>
          </div>
          <div className="mb-3 tj-app-input">
            <div className="form-label" data-cy="column-name-input-field-label">
              <span style={{ marginRight: '6px' }}>Column name</span>
              {selectedColumn?.constraints_type?.is_primary_key === true}
            </div>
            <input
              value={columnName}
              type="text"
              placeholder="Enter column name"
              className="form-control"
              data-cy="column-name-input-field"
              autoComplete="off"
              onChange={(e) => {
                setForeignKeyDetails((prevState) => {
                  return prevState.map((item) => {
                    return {
                      ...item,
                      column_names: item.column_names.map((col) => {
                        return col === columnName ? e.target.value : col;
                      }),
                    };
                  });
                });
                setColumnName(e.target.value);
              }}
              autoFocus
            />
          </div>
          {castReport?.status === 'loading' && (
            <div className={cx(infoBoxClass('accent'), 'tw-mb-2')} data-cy="cast-report-loading">
              <Spinner size="small" />
              <span>Checking existing values…</span>
            </div>
          )}
          {castReport?.status === 'uncheckable' && (
            <div className={cx(infoBoxClass('accent'), 'tw-mb-2')} data-cy="cast-report-uncheckable">
              <Information fill="var(--icon-accent)" width="28" />
              <span>
                Existing values can&apos;t be checked in advance for this conversion. Rows that aren&apos;t valid will
                stop the migration.
              </span>
            </div>
          )}
          {castReport?.status === 'error' && (
            <div className={cx(infoBoxClass('accent'), 'tw-mb-2')} data-cy="cast-report-error">
              <Information fill="var(--icon-accent)" width="28" />
              <span>Couldn&apos;t check existing values: {castReport.message}</span>
            </div>
          )}
          {castReport?.status === 'done' && castReport.values.length > 0 && (
            <div className={cx(infoBoxClass('danger'), 'tw-mb-2')} data-cy="cast-report-bad-values">
              <Warning fill="var(--icon-danger)" width="28" height="28" />
              <span>
                {castReport.truncated ? '20+ values' : `${castReport.values.length} value(s)`} in this column can&apos;t
                be converted: {castReport.values.map((value) => `'${value}'`).join(', ')}
                {castReport.truncated ? ', …' : ''}. Fix these in every environment before promoting.
              </span>
            </div>
          )}
          {castReport?.status === 'done' && castReport.values.length === 0 && (
            <div className={cx(infoBoxClass('success'), 'tw-mb-2')} data-cy="cast-report-clean">
              <CheckCircle fill="var(--icon-success)" width="28" height="28" />
              <span>
                Every value in this environment converts cleanly. Other environments are checked when you switch to
                them.
              </span>
            </div>
          )}
          <div
            className="column-datatype-selector mb-3 data-type-dropdown-section"
            data-cy="data-type-dropdown-section"
          >
            <div className="form-label" data-cy="data-type-input-field-label">
              Data type
            </div>
            <div className="tj-select-text">
              <Select
                // Primary keys and auto-incrementing columns keep the old lockdown: a PK's type is
                // load-bearing for every foreign key pointing at it, and a serial carries a sequence
                // that would have to move with it.
                isDisabled={isTypeChangeLocked}
                value={dataType}
                formatOptionLabel={formatOptionLabel}
                options={typeOptions}
                onChange={handleTypeChange}
                components={{ IndicatorSeparator: () => null }}
                styles={customStyles}
                isSearchable={false}
              />
            </div>
            {isTypeChangeLocked && (
              <div className="tw-text-xs tw-text-[var(--text-placeholder)] tw-mt-1" data-cy="data-type-locked-reason">
                {selectedColumn?.constraints_type?.is_primary_key
                  ? 'A primary key’s type cannot be changed.'
                  : isForeignKey
                  ? 'A column under a foreign key needs both sides changed together — use a SQL migration.'
                  : 'An auto-incrementing column’s type cannot be changed.'}
              </div>
            )}
            {omittedReasons.length > 0 && (
              <div className={cx(infoBoxClass('accent'), 'tw-mt-1')} data-cy="data-type-omitted-reasons">
                <Information fill="var(--icon-accent)" width="28" height="28" />
                <span>
                  Some conversions aren&apos;t listed:
                  <ul className="tw-mt-1 tw-mb-0 tw-pl-4">
                    {omittedReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                  Record a SQL migration from the migration history drawer for those.
                </span>
              </div>
            )}
          </div>
          {isTimestamp && (
            <div
              className="column-datatype-selector mb-3 data-type-dropdown-section"
              data-cy="timezone-type-dropdown-section"
            >
              <div className="form-label" data-cy="data-type-input-field-label">
                Display time
              </div>
              <Select
                //useMenuPortal={false}
                placeholder="Select Timezone"
                value={tzDictionary[timezone]}
                formatOptionLabel={formatOptionLabel}
                options={tzOptions}
                onChange={(option) => {
                  setTimezone(option.value);
                }}
                styles={defaultStyles(darkMode, '100%')}
                components={{ Option: CustomSelectOption, IndicatorSeparator: () => null }}
              />
            </div>
          )}
          <div className="mb-3 tj-app-input">
            <div className="d-flex align-items-center justify-content-between">
              <div className="form-label" data-cy="default-value-input-field-label">
                Default value
              </div>
              {isMatchingForeignKeyColumn(selectedColumn?.Header) && (
                <ToolTip
                  message={
                    isNotNull
                      ? 'Disable the NOT NULL constraint to set the default value to Null'
                      : 'Set the default value for the column to Null'
                  }
                  placement="top"
                  tooltipClassName="tootip-table"
                  show={isMatchingForeignKeyColumn(selectedColumn?.Header) || isNotNull}
                >
                  <div className="d-flex align-items-center custom-gap-4">
                    <span className="form-label">Set default value to Null</span>
                    <label className={`form-switch`}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={defaultValue === null}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForeignKeyDefaultValue({ label: null, value: null });
                            setDefaultValue(null);
                          } else {
                            setForeignKeyDefaultValue({ label: '', value: '' });
                            setDefaultValue('');
                          }
                        }}
                        disabled={isNotNull}
                      />
                    </label>
                  </div>
                </ToolTip>
              )}
            </div>

            <ToolTip
              message={selectedColumn?.dataType === 'serial' ? 'Serial data type values cannot be modified' : null}
              placement="top"
              tooltipClassName="tootip-table"
              show={selectedColumn?.dataType === 'serial'}
            >
              <div style={{ position: 'relative' }}>
                {isTimestamp ? (
                  <DateTimePicker
                    timestamp={defaultValue}
                    setTimestamp={setDefaultValue}
                    timezone={timezone}
                    isClearable={true}
                    isPlaceholderEnabled={true}
                  />
                ) : isJsonbColumnType ? (
                  <div className="tjdb-codehinter-wrapper-drawer" onKeyDown={(e) => e.stopPropagation()}>
                    {codehinterCallback()}
                  </div>
                ) : !isMatchingForeignKeyColumn(selectedColumn?.Header) ? (
                  <input
                    value={selectedColumn?.dataType !== 'serial' ? defaultValue : null}
                    type="text"
                    placeholder={selectedColumn?.dataType === 'serial' ? 'Auto-generated' : 'Enter default value'}
                    className={'form-control'}
                    data-cy="default-value-input-field"
                    autoComplete="off"
                    onChange={(e) => setDefaultValue(e.target.value)}
                    disabled={selectedColumn?.dataType === 'serial'}
                  />
                ) : (
                  <>
                    <DropDownSelect
                      buttonClasses="border border-end-1 foreignKeyAcces-container-drawer mb-2"
                      showPlaceHolder={true}
                      options={referenceTableDetails}
                      darkMode={darkMode}
                      emptyError={
                        <div className="dd-select-alert-error m-2 d-flex align-items-center">
                          <Information />
                          No data found
                        </div>
                      }
                      loader={
                        <>
                          <Skeleton
                            height={22}
                            width={396}
                            className="skeleton"
                            style={{ margin: '15px 50px 7px 7px' }}
                          />
                          <Skeleton
                            height={22}
                            width={450}
                            className="skeleton"
                            style={{ margin: '7px 14px 7px 7px' }}
                          />
                          <Skeleton
                            height={22}
                            width={396}
                            className="skeleton"
                            style={{ margin: '7px 50px 15px 7px' }}
                          />
                        </>
                      }
                      isLoading={true}
                      value={foreignKeyDefaultValue}
                      foreignKeyAccessInRowForm={true}
                      disabled={
                        selectedColumn?.dataType === 'serial' || selectedColumn.constraints_type.is_primary_key === true
                      }
                      topPlaceHolder={
                        selectedColumn?.dataType === 'serial'
                          ? 'Auto-generated'
                          : foreignKeyDefaultValue?.value === null || defaultValue === null
                          ? 'Null'
                          : 'Enter a value'
                      }
                      onChange={(value) => {
                        setForeignKeyDefaultValue(value);
                        setDefaultValue(value?.value);
                      }}
                      onAdd={true}
                      addBtnLabel={'Open referenced table'}
                      foreignKeys={foreignKeys}
                      setReferencedColumnDetails={setReferencedColumnDetails}
                      scrollEventForColumnValues={true}
                      cellColumnName={selectedColumn?.Header}
                      columnDataType={dataType?.value}
                      isEditColumn={true}
                    />
                    {defaultValue === null && <p className={darkMode === true ? 'null-tag-dark' : 'null-tag'}>Null</p>}
                  </>
                )}
              </div>
            </ToolTip>
            {isNotNull === true && dataType?.value !== 'serial' && defaultValue?.length <= 0 ? (
              <span className="form-error-message">
                Default value is required to populate this field in existing rows as NOT NULL constraint is added
              </span>
            ) : null}
            {isNotNull === true &&
            selectedColumn?.dataType !== 'serial' &&
            rows.length > 0 &&
            !isEmpty(defaultValue) &&
            defaultValueLength > 0 ? (
              <span className="form-warning-message">
                Changing the default value will NOT update the fields having existing default value
              </span>
            ) : null}
          </div>
          {/* foreign key toggle */}
          <div className="row mb-3">
            <ToolTip
              message={
                dataType?.value === 'serial'
                  ? 'Foreign key relation cannot be created for serial type column'
                  : dataType?.value === 'boolean'
                  ? 'Foreign key relation cannot be created for boolean type column'
                  : dataType?.value === 'timestamp with time zone'
                  ? 'Foreign key relation cannot be created for this data type'
                  : dataType?.value === 'jsonb'
                  ? 'Foreign key relation cannot be created for JSON data type'
                  : 'Fill in column details to create a foreign key relation'
              }
              placement="top"
              tooltipClassName="tootip-table"
              show={
                isEmpty(dataType) ||
                isEmpty(columnName) ||
                ['boolean', 'serial', 'timestamp with time zone', 'jsonb'].includes(dataType?.value)
              }
            >
              <div className="col-1">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isForeignKey}
                    onChange={(e) => {
                      if (isMatchingForeignKeyColumn(columnName)) {
                        setIsForeignKey(e.target.checked);
                        setIsForeignKeyDraweOpen(false);
                      } else {
                        setIsForeignKey(e.target.checked);
                        setIsForeignKeyDraweOpen(e.target.checked);
                        setCreateForeignKeyInEdit(e.target.checked);
                      }
                    }}
                    disabled={
                      dataType?.value === 'serial' ||
                      isEmpty(dataType) ||
                      isEmpty(columnName) ||
                      ['boolean', 'serial', 'timestamp with time zone', 'jsonb'].includes(dataType?.value)
                    }
                  />
                </label>
              </div>
            </ToolTip>
            <div className="col d-flex flex-column">
              <p className="m-0 p-0 fw-500 tj-switch-text">Foreign key relation</p>
              <p className="fw-400 secondary-text tj-text-xsm mb-2 tj-switch-text">
                Adding a foreign key relation will link this column with a column in an existing table.
              </p>
              {foreignKeyDetails?.length > 0 && isMatchingForeignKeyColumn(selectedColumn?.Header) && isForeignKey && (
                <div className="foreignKey-details mt-0">
                  <span className="foreignKey-text">
                    {isMatchingForeignKeyColumnDetails(columnName)?.column_names[0]}
                  </span>
                  <div className="foreign-key-relation">
                    <ForeignKeyRelationIcon width="13" height="13" />
                  </div>
                  <span className="foreignKey-text">{`${
                    isMatchingForeignKeyColumnDetails(columnName)?.referenced_table_name
                  }.${isMatchingForeignKeyColumnDetails(columnName)?.referenced_column_names[0]}`}</span>
                  <div
                    className="editForeignkey"
                    onClick={() => {
                      openEditForeignKey(isMatchingForeignKeyColumnDetails(columnName)?.column_names[0]);
                    }}
                  >
                    <EditIcon width="17" height="18" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Drawer
            isOpen={isForeignKeyDraweOpen}
            position="right"
            drawerStyle={{ width: '560px' }}
            isForeignKeyRelation={true}
            onClose={() => {
              onCloseForeignKeyDrawer();
            }}
            className="tj-db-drawer"
          >
            <ForeignKeyTableForm
              tableName={selectedTable.table_name}
              columns={columns}
              onClose={() => {
                onCloseForeignKeyDrawer();
              }}
              isEditColumn={isEditColumn}
              isForeignKeyForColumnDrawer={true}
              handleCreateForeignKey={handleCreateForeignKeyinEditMode}
              setForeignKeyDetails={setForeignKeyDetails}
              foreignKeyDetails={foreignKeyDetails}
              organizationId={organizationId}
              existingForeignKeyDetails={foreignKeys}
              setSourceColumn={setSourceColumn}
              sourceColumn={sourceColumn}
              setTargetTable={setTargetTable}
              targetTable={targetTable}
              setTargetColumn={setTargetColumn}
              targetColumn={targetColumn}
              setOnDelete={setOnDelete}
              onDelete={onDelete}
              setOnUpdate={setOnUpdate}
              onUpdate={onUpdate}
              handleEditForeignKey={handleEditForeignKey}
              createForeignKeyInEdit={createForeignKeyInEdit}
              isForeignKeyDraweOpen={isForeignKeyDraweOpen}
              onDeletePopup={handleDeleteForeignKeyColumn}
              selectedForeignkeyIndex={selectedForeignkeyIndex}
              initiator="ForeignKeyTableForm"
            />
          </Drawer>
          {/* <ForeignKeyRelation tableName={selectedTable.table_name} columns={columns} /> */}
          <ToolTip
            message={
              selectedColumn.constraints_type.is_primary_key === true
                ? 'Primary key values cannot be null'
                : selectedColumn.dataType === 'serial' &&
                  (selectedColumn.constraints_type.is_primary_key !== true ||
                    selectedColumn.constraints_type.is_primary_key === true)
                ? 'Serial data type cannot have null value'
                : null
            }
            placement="top"
            tooltipClassName="tooltip-table-edit-column"
            style={toolTipPlacementStyle}
            show={
              selectedColumn.constraints_type.is_primary_key === true ||
              (selectedColumn.dataType === 'serial' &&
                (selectedColumn.constraints_type.is_primary_key !== true ||
                  selectedColumn.constraints_type.is_primary_key === true))
            }
          >
            <div className="row mb-1">
              <div className="col-1">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isNotNull}
                    onChange={(e) => {
                      setIsNotNull(e.target.checked);
                      if (e.target.checked && defaultValue === null) {
                        setForeignKeyDefaultValue({ label: '', value: '' });
                        setDefaultValue('');
                      }
                    }}
                    disabled={selectedColumn?.dataType === 'serial' || selectedColumn?.constraints_type?.is_primary_key}
                  />
                </label>
              </div>
              <div className="col d-flex flex-column">
                <p className="m-0 p-0 fw-500 tj-switch-text">NOT NULL</p>
                <p className="fw-400 secondary-text tj-text-xsm mb-2 tj-switch-text">
                  This constraint will restrict entry of NULL values in this column.
                </p>
              </div>
            </div>
          </ToolTip>

          <ToolTip
            message={
              selectedColumn.constraints_type.is_primary_key === true
                ? 'Primary key values must be unique'
                : selectedColumn.dataType === 'serial' &&
                  (selectedColumn.constraints_type.is_primary_key !== true ||
                    selectedColumn.constraints_type.is_primary_key === true)
                ? 'Serial data type value must be unique'
                : selectedColumn.dataType === 'boolean'
                ? 'Unique constraint cannot be added for boolean type column'
                : selectedColumn.dataType === 'timestamp with time zone'
                ? 'Unique constraint cannot be added for this type column'
                : selectedColumn.dataType === 'jsonb'
                ? 'Unique constraint cannot be added for JSON type column'
                : null
            }
            placement="top"
            tooltipClassName="tooltip-table-edit-column"
            style={toolTipPlacementStyle}
            show={
              selectedColumn.constraints_type?.is_primary_key === true ||
              (selectedColumn.dataType === 'serial' &&
                (selectedColumn.constraints_type.is_primary_key !== true ||
                  selectedColumn.constraints_type.is_primary_key === true)) ||
              ['boolean', 'timestamp with time zone', 'jsonb'].includes(selectedColumn.dataType)
            }
          >
            <div className="row mb-1">
              <div className="col-1">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      !isUniqueConstraint && selectedColumn?.constraints_type?.is_primary_key
                        ? true
                        : isUniqueConstraint
                    }
                    onChange={(e) => {
                      setIsUniqueConstraint(e.target.checked);
                    }}
                    disabled={
                      ['serial', 'boolean', 'timestamp with time zone', 'jsonb'].includes(selectedColumn?.dataType) ||
                      selectedColumn?.constraints_type?.is_primary_key
                    }
                  />
                </label>
              </div>
              <div className="col d-flex flex-column">
                <p className="m-0 p-0 fw-500 tj-switch-text">{'UNIQUE'}</p>
                <p className="fw-400 secondary-text tj-text-xsm tj-switch-text">
                  This constraint restricts entry of duplicate values in this column.
                </p>
              </div>
            </div>
          </ToolTip>
        </div>
        <DrawerFooter
          isEditMode={true}
          onClose={onClose}
          onEdit={handleEdit}
          shouldDisableCreateBtn={disabledSaveButton}
          showToolTipForFkOnReadDocsSection={true}
          initiator={initiator}
        />
      </div>
      {migrationModal}
    </>
  );
};
export default ColumnForm;
