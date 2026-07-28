import React from 'react';
import moment from 'moment';
import { X } from 'lucide-react';
import { resolveReferences } from '@/_helpers/utils';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Checkbox } from '@/components/ui/Rocket';

// Kept in parity with `getExportFileName` in NewTable/_utils/exportData.js
// an empty file name falls back to the auto-generated `<component>_<DD-MM-YYYY_HH-mm>` convention.
const buildDisplayName = (componentName, downloadFileName) => {
  const trimmed = typeof downloadFileName === 'string' ? downloadFileName.trim() : '';
  return trimmed.length ? trimmed : `${componentName}_${moment().format('DD-MM-YYYY_HH-mm')}`;
};

/**
 * Config popover for the "Download data" toolbar item.
 * Configures a dynamic file name (fx-capable) and whether the export is limited to the currently-filtered rows.
 */
export const ConfigureDownload = ({ component, paramUpdated, onClose }) => {
  const definitionProps = component?.component?.definition?.properties || {};
  const fileNameDef = definitionProps.downloadFileName || {};
  const fileName = fileNameDef.value ?? '';

  const filteredValue = resolveReferences(definitionProps.downloadFilteredData?.value);
  const isFilteredOnly = !!filteredValue;

  const displayName = buildDisplayName(component?.component?.name, resolveReferences(fileName));

  const handleFileNameChange = (value) => paramUpdated({ name: 'downloadFileName' }, 'value', value, 'properties');
  const handleFilteredToggle = (checked) =>
    paramUpdated({ name: 'downloadFilteredData' }, 'value', checked === true ? '{{true}}' : '{{false}}', 'properties');

  return (
    <div data-cy="configure-download-popover">
      <div className="tw-flex tw-h-11 tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4">
        <span className="tw-font-title-default tw-text-text-default">Configure download data</span>
        <button
          type="button"
          aria-label="Close"
          data-cy="configure-download-close"
          onClick={onClose}
          className="tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default tw-cursor-pointer hover:tw-text-icon-strong"
        >
          <X size={14} />
        </button>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-font-title-default tw-text-text-default">File name</span>
          <CodeHinter
            type="basic"
            initialValue={fileName}
            onChange={handleFileNameChange}
            usePortalEditor={false}
            component={component?.component}
            cyLabel="download-file-name"
          />
          <span className="tw-font-body-small tw-text-text-placeholder" data-cy="download-saved-as-hint">
            Saved as {displayName}.csv
          </span>
        </div>

        <label className="tw-flex tw-items-start tw-gap-2 tw-cursor-pointer" data-cy="download-filtered-only">
          <Checkbox checked={isFilteredOnly} onCheckedChange={handleFilteredToggle} className="tw-mt-0.5" />
          <span className="tw-flex tw-flex-col">
            <span className="tw-font-body-default tw-text-text-default">Download only filtered data</span>
            <span className="tw-font-body-small tw-text-text-placeholder">
              Exports only rows matching your current filters.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default ConfigureDownload;
