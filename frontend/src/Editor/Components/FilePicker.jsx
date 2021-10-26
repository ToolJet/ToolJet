import React, { useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const FilePicker = ({ width, height, component, currentState, onComponentOptionChanged, onEvent, darkMode }) => {
  //* property definations
  const enableDropzone = component.definition.properties.enableDropzone?.value ?? true;
  const enablePicker = component.definition.properties?.enablePicker?.value ?? true;
  const maxFileCount = component.definition.properties.maxFileCount?.value ?? 2;
  const enableMultiple = component.definition.properties.enableMultiple?.value ?? false;
  const fileType = component.definition.properties.fileType?.value ?? 'image/*';
  const maxSize = component.definition.properties.maxSize?.value ?? 1048576;
  const minSize = component.definition.properties.minSize?.value ?? 0;

  const parsedEnableDropzone =
    typeof enableDropzone !== 'boolean' ? resolveWidgetFieldValue(enableDropzone, currentState) : true;
  const parsedEnablePicker =
    typeof enablePicker !== 'boolean' ? resolveWidgetFieldValue(enablePicker, currentState) : true;
  const parsedMaxFileCount =
    typeof maxFileCount !== 'number' ? resolveWidgetFieldValue(maxFileCount, currentState) : maxFileCount;
  const parsedEnableMultiple =
    typeof enableMultiple !== 'boolean' ? resolveWidgetFieldValue(enableMultiple, currentState) : enableMultiple;
  const parsedFileType = typeof fileType !== 'string' ? resolveWidgetFieldValue(fileType, currentState) : 'image/*';
  const parsedMinSize = typeof fileType !== 'number' ? resolveWidgetFieldValue(minSize, currentState) : minSize;
  const parsedMaxSize = typeof fileType !== 'number' ? resolveWidgetFieldValue(maxSize, currentState) : maxSize;

  //* style definations
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;
  const parsedWidgetVisibility =
    typeof widgetVisibility !== 'boolean' ? resolveWidgetFieldValue(widgetVisibility, currentState) : widgetVisibility;

  const bgThemeColor = darkMode ? '#232E3C' : '#fff';

  const baseStyle = {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    borderWidth: 1.5,
    borderRadius: 2,
    borderColor: '#42536A',
    borderStyle: 'dashed',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
    display: parsedWidgetVisibility ? 'flex' : 'none',
    width,
    height,
    backgroundColor: !parsedDisabledState && bgThemeColor,
  };

  const activeStyle = {
    borderColor: '#2196f3',
  };

  const acceptStyle = {
    borderColor: '#00e676',
  };

  const rejectStyle = {
    borderColor: '#ff1744',
  };

  React.useEffect(() => {
    console.log('parsedEnablePicker', parsedEnablePicker);
  }, [parsedEnablePicker]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, acceptedFiles } = useDropzone({
    accept: parsedFileType,
    noClick: !parsedEnablePicker,
    noKeyboard: true,
    maxFiles: parsedMaxFileCount,
    minSize: parsedMinSize,
    maxSize: parsedMaxSize,
    multiple: parsedEnableMultiple,
    disabled: parsedDisabledState,
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive && parsedEnableDropzone ? activeStyle : {}),
      ...(isDragAccept && parsedEnableDropzone ? acceptStyle : {}),
      ...(isDragReject && parsedEnableDropzone ? rejectStyle : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseStyle, isDragActive, isDragAccept, acceptStyle, isDragReject]
  );

  useEffect(() => {
    console.log('acceptedFiles', acceptedFiles);
    if (!isDragReject) {
      const fileSelected = acceptedFiles.map((acceptedFile) => ({
        name: acceptedFile.name.substring(0, acceptedFile.name.lastIndexOf('.')),
        content: JSON.stringify(acceptedFile),
        type: acceptedFile.type,
      }));
      onComponentOptionChanged(component, 'file', fileSelected).then(() => onEvent('onFileSelected', { component }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedFiles, isDragReject]);

  return (
    <div className="container text-center" {...getRootProps({ style, className: parsedEnableDropzone && 'dropzone' })}>
      <center>
        <input {...getInputProps()} />
        {!isDragActive && (
          <p className={parsedDisabledState ? 'text-mute' : 'text-azure'}>
            Drag & drop some files here, or click to select files
          </p>
        )}

        {isDragAccept && <p className="text-success">All files will be accepted</p>}
        {isDragReject && <p className="text-danger">File is too large.</p>}
      </center>
    </div>
  );
};

//Todo: display text according to the selectors [picker, dragzone]
//Todo: Replace the icon
