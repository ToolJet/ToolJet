import React from 'react';
import { Label } from '../../Label/Label';
import { FileTypeIcon, RemoveIcon } from '../FileUploaderUtils/FileUploaderUtils';

const FileListComponent = ({ type, files, onRemove, width }) => {
  return (
    files.length > 0 && (
      <div className={`${type === 'multiple' && 'tw-mt-[24px]'}`} style={{ width: width }}>
        {type === 'multiple' && (
          <Label
            htmlFor="label"
            type="label"
            size="default"
            className={`tw-font-medium tw-ml-[2px] tw-mb-[4px] tw-text-text-default`}
          >
            Uploaded Files
          </Label>
        )}
        {files.map((file, index) => (
          <div
            key={index}
            className="tw-bg-background-surface-layer-02 tw-flex tw-items-center tw-justify-between tw-p-[8px] tw-rounded-[6px] tw-mb-[8px]"
          >
            <div className="tw-flex tw-items-start tw-flex-[1_0%_0%] tw-gap-[8px]">
              <div className="tw-bg-background-surface-layer-01 tw-flex tw-h-[36px] tw-w-[36px] tw-py-[7px] tw-px-[9px] tw-justify-center tw-items-center tw-rounded-[6px]">
                <FileTypeIcon filetype={file.type} />
              </div>
              <div className="tw-flex tw-flex-col tw-flex-[1_0%_0%] tw-items-start">
                <span className="tw-text-text-default tw-text-[12px]/[18px] tw-font-medium tw-line-clamp-1">
                  {file.name}
                </span>
                <span className="tw-text-[11px]/[16px] tw-font-normal tw-text-text-placeholder">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>
            </div>
            <div className="tw-h-[36px] tw-flex tw-items-start">
              <div className="tw-flex tw-h-[20px] tw-w-[20px] tw-p-[4px] tw-items-center tw-justify-center tw-cursor-pointer">
                <RemoveIcon onClick={() => onRemove(file)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  );
};

export default FileListComponent;
