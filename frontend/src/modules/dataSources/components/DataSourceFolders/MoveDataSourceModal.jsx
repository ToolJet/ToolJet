import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import Modal from '@/HomePage/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { decodeEntities } from '@/_helpers/utils';
import './dataSourceFolders.scss';

// Hide react-select's indicator separator for a cleaner single-caret look (matches the design).
const selectComponentOverrides = { IndicatorSeparator: () => null };

// "Update folder" modal (design Img 24): move one or more data sources into a target folder.
// Opened from a data source's "Move folder" menu, pre-filled with that data source; more can be
// added via the multi-select. Submitting bulk-adds/moves them (the backend auto-moves any that
// already belong to another folder).
export const MoveDataSourceModal = ({ show, initialDataSource, dataSources, folders, onClose, onSubmit }) => {
  const [selectedDataSources, setSelectedDataSources] = useState([]);
  const [targetFolder, setTargetFolder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dataSourceOptions = useMemo(
    () => (dataSources ?? []).map((ds) => ({ value: ds.id, label: decodeEntities(ds.name) })),
    [dataSources]
  );

  // Target folders exclude any folder that already contains ALL currently-selected data sources —
  // moving there would be a no-op, so the folder a data source already belongs to is hidden.
  const folderOptions = useMemo(() => {
    const selectedIds = selectedDataSources.map((option) => option.value);
    return (folders ?? [])
      .filter((folder) => {
        if (selectedIds.length === 0) return true;
        const memberIds = new Set((folder.folder_data_sources ?? []).map((m) => m.data_source_id));
        return !selectedIds.every((id) => memberIds.has(id));
      })
      .map((folder) => ({ value: folder.id, label: folder.name }));
  }, [folders, selectedDataSources]);

  useEffect(() => {
    if (show) {
      setSelectedDataSources(
        initialDataSource ? [{ value: initialDataSource.id, label: decodeEntities(initialDataSource.name) }] : []
      );
      setTargetFolder(null);
      setIsSubmitting(false);
    }
  }, [show, initialDataSource]);

  // If the selection changes so the chosen target is no longer a valid destination, clear it.
  useEffect(() => {
    if (targetFolder && !folderOptions.some((option) => option.value === targetFolder.value)) {
      setTargetFolder(null);
    }
  }, [folderOptions, targetFolder]);

  const isDisabled = selectedDataSources.length === 0 || !targetFolder || isSubmitting;

  const handleSubmit = () => {
    if (isDisabled) return;
    setIsSubmitting(true);
    onSubmit(
      selectedDataSources.map((option) => option.value),
      targetFolder.value
    )
      .then(() => {
        toast.success('Data sources moved successfully!');
        onClose();
      })
      .catch(({ error }) => {
        toast.error(error || 'Could not move data sources');
        setIsSubmitting(false);
      });
  };

  return (
    <Modal show={show} closeModal={onClose} title="Update folder" customClassName="move-datasource-modal">
      <div className="move-datasource-modal-body">
        <div className="move-ds-field">
          <label className="move-ds-label">Move selected data sources</label>
          <Select
            isMulti
            isClearable={false}
            classNamePrefix="move-ds-select"
            className="move-ds-select"
            components={selectComponentOverrides}
            options={dataSourceOptions}
            value={selectedDataSources}
            onChange={(value) => setSelectedDataSources(value ?? [])}
            isDisabled={isSubmitting}
            placeholder="Select data sources.."
            menuPortalTarget={document.body}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </div>
        <div className="move-ds-to">to</div>
        <div className="move-ds-field">
          <label className="move-ds-label">Folder name</label>
          <Select
            isClearable={false}
            classNamePrefix="move-ds-select"
            className="move-ds-select"
            components={selectComponentOverrides}
            options={folderOptions}
            value={targetFolder}
            onChange={setTargetFolder}
            isDisabled={isSubmitting}
            placeholder="Select folder"
            menuPortalTarget={document.body}
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </div>
      </div>
      <div className="move-datasource-modal-footer">
        <ButtonSolid variant="tertiary" onClick={onClose} data-cy="cancel-button">
          Cancel
        </ButtonSolid>
        <ButtonSolid
          onClick={handleSubmit}
          data-cy="move-datasource-to-folder-button"
          isLoading={isSubmitting}
          disabled={isDisabled}
        >
          Add to folder
        </ButtonSolid>
      </div>
    </Modal>
  );
};
