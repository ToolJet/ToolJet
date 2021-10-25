import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const FilePicker = ({ width, height, component, currentState, onComponentOptionChanged, onEvent }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  //* property definations
  const enableDropzone = component.definition.properties.enableDropzone?.value ?? true;
  const enablePicker = component.definition.properties.enablePicker?.value ?? true;
  const maxFileCount = component.definition.properties.maxFileCount?.value ?? 2;
  const enableMultiple = component.definition.properties.enableMultiple?.value ?? false;
  const fileType = component.definition.properties.fileType?.value ?? 'image/*';
  const maxSize = component.definition.properties.maxSize?.value ?? 1048576;
  const minSize = component.definition.properties.minSize?.value ?? 0;

  const parsedEnableDropzone =
    typeof enableDropzone !== 'boolean' ? resolveWidgetFieldValue(enableDropzone, currentState) : enableDropzone;
  const parsedEnablePicker =
    typeof enablePicker !== 'boolean' ? resolveWidgetFieldValue(enablePicker, currentState) : enablePicker;
  const parsedMaxFileCount =
    typeof maxFileCount !== 'number' ? resolveWidgetFieldValue(maxFileCount, currentState) : maxFileCount;
  const parsedEnableMultiple =
    typeof enableMultiple !== 'boolean' ? resolveWidgetFieldValue(enableMultiple, currentState) : enableMultiple;
  const parsedFileType = typeof fileType !== 'string' ? resolveWidgetFieldValue(fileType, currentState) : fileType;
  const parsedMinSize = typeof fileType !== 'number' ? resolveWidgetFieldValue(minSize, currentState) : minSize;
  const parsedMaxSize = typeof fileType !== 'number' ? resolveWidgetFieldValue(maxSize, currentState) : maxSize;

  //* style definations
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;
  const parsedWidgetVisibility =
    typeof widgetVisibility !== 'boolean' ? resolveWidgetFieldValue(widgetVisibility, currentState) : widgetVisibility;

  const style = {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: 1,
    borderRadius: 1,
    borderStyle: 'dashed',
    outline: 'none',
    transition: 'border .24s ease-in-out',
    width,
    height,
    display: parsedWidgetVisibility ? 'flex' : 'none',
  };

  const isFileTooLarge = rejectedFiles?.length > 0 && rejectedFiles[0].size > parsedMaxSize;
  const { getRootProps, getInputProps, open, rejectedFiles, isDragActive, isDragReject, isDragAccept, draggedFiles } =
    useDropzone({
      accept: parsedFileType,
      noClick: true,
      noKeyboard: true,
      maxFiles: parsedMaxFileCount,
      minSize: parsedMinSize,
      maxSize: parsedMinSize,
      onDrop,
      multiple: parsedEnableMultiple,
      disabled: parsedDisabledState,
    });

  const onDrop = (acceptedFiles) => {
    console.log(acceptedFiles);
    if (isDragAccept) {
      setSelectedFiles(() =>
        acceptedFiles.map((acceptedFile) => ({
          name: acceptedFile.name.substring(0, acceptedFile.name.lastIndexOf('.')),
          content: JSON.stringify(acceptedFile),
          type: acceptedFile.type,
        }))
      );
    }
  };

  React.useEffect(() => {
    if (selectedFiles.length > 0) {
      onComponentOptionChanged(component, 'file', selectedFiles).then(() => onEvent('onFileSelected', { component }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  return (
    <div className="container text-center border-light p-1" {...getRootProps({ style })}>
      <div>{parsedEnablePicker && <button onClick={open}>Open File Dialog</button>}</div>
      <div className="mt-1">{parsedEnableDropzone && <input style={{ width, height }} {...getInputProps()} />}</div>

      <div className="mt-1">
        {!isDragActive && (
          <span className="text-secondary">
            {parsedEnablePicker && !parsedEnableDropzone && 'Click here to select a file!'}
            {parsedEnableDropzone && !parsedEnablePicker && 'Drag files here.'}
            {parsedEnableDropzone && parsedEnableDropzone && 'Click here or Drag files here'}
          </span>
        )}
        {isDragActive && !isDragReject && <span className="text-info">Drop Area</span>}
        {isFileTooLarge && <span className="text-danger">File is too large.</span>}
        {draggedFiles && isDragReject && <span>{draggedFiles.length}</span>}
      </div>
    </div>
  );
};
