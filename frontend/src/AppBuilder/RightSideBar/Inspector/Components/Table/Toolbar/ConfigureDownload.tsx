import React from 'react';
import moment from 'moment';
import { resolveReferences } from '@/_helpers/utils';
import { Button } from '@/components/ui/Button/Button';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Checkbox } from '@/components/ui/Rocket';

// Untyped (.jsx) imports — cast to loose component types so they can be used as JSX under strict TS.
const ButtonComponent = Button as React.ComponentType<any>
const CodeHinterComponent = CodeHinter as React.ComponentType<any>;
const CheckboxComponent = Checkbox as React.ComponentType<any>;

type ParamUpdate = (param: Record<string, any>, attr: string, value: unknown, paramType?: string) => void;

interface ConfigureDownloadProps {
  component: any;
  paramUpdated: ParamUpdate;
  onClose: () => void;
}

// Kept in parity with `getExportFileName` in NewTable/_utils/exportData.js
// an empty file name falls back to the auto-generated `<component>_<DD-MM-YYYY_HH-mm>` convention.
const buildDisplayName = (componentName: string, downloadFileName: unknown): string => {
  const trimmed = typeof downloadFileName === 'string' ? downloadFileName.trim() : '';
  return trimmed.length ? trimmed : `${componentName}_${moment().format('DD-MM-YYYY_HH-mm')}`;
};

/**
 * Config popover for the "Download data" toolbar item.
 * Configures a dynamic file name (fx-capable) and whether the export is limited to the currently-filtered rows.
 */
export const ConfigureDownload = ({ component, paramUpdated, onClose }: ConfigureDownloadProps) => {
  const definitionProps = component?.component?.definition?.properties || {};
  const fileNameDef = definitionProps.downloadFileName || {};
  const fileName = fileNameDef.value ?? '';

  const filteredValue = resolveReferences(definitionProps.downloadFilteredData?.value);
  const isFilteredOnly = !!filteredValue;

  const displayName = buildDisplayName(component?.component?.name, resolveReferences(fileName));

  const handleFileNameChange = (value: string) =>
    paramUpdated({ name: 'downloadFileName' }, 'value', value, 'properties');
  const handleFilteredToggle = (checked: boolean | 'indeterminate') =>
    paramUpdated({ name: 'downloadFilteredData' }, 'value', checked === true ? '{{true}}' : '{{false}}', 'properties');

  return (
    <div data-cy="configure-download-popover">
      <div className="tw-flex tw-h-11 tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4">
        <span className="tw-font-title-default tw-text-text-default">Configure download data</span>
        <ButtonComponent
          fill="var(--icon-default)"
          iconOnly
          isLucid
          leadingIcon="x"
          onClick={onClose}
          size="medium"
          variant="ghost"
        />
      </div>

      <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-font-title-default tw-text-text-default">File name</span>
          <CodeHinterComponent
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
          <CheckboxComponent checked={isFilteredOnly} onCheckedChange={handleFilteredToggle} className="tw-mt-0.5" />
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
