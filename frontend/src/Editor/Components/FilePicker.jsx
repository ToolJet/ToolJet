import React, { useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { toast } from 'react-toastify';

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
  const parsedFileType = resolveWidgetFieldValue(fileType, currentState);
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

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, acceptedFiles, fileRejections } =
    useDropzone({
      accept: parsedFileType,
      noClick: !parsedEnablePicker,
      noDrag: !parsedEnableDropzone,
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

  const [accepted, setAccepted] = React.useState(false);

  useEffect(() => {
    if (acceptedFiles.length !== 0) {
      const fileData = [];
      acceptedFiles.map((acceptedFile) => {
        return new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onload = (result) => {
            //* Resolve both the FileReader result and its original file.
            resolve([result, acceptedFile]);
          };
          //* Reads contents of the file as a text string.
          reader.readAsText(acceptedFile);
        }).then((zippedResults) => {
          //? Run the callback after all files have been read.
          const fileSelected = {
            name: zippedResults[1].name,
            content: zippedResults[0].srcElement.result,
            type: zippedResults[1].type,
          };

          fileData.push(fileSelected);
        });
      });
      onComponentOptionChanged(component, 'file', fileData).then(() =>
        onEvent('onFileSelected', { component }).then(() => {
          setAccepted(true);
          return new Promise(function (resolve, reject) {
            setTimeout(() => {
              setAccepted(false);
              resolve();
            }, 200);
          });
        })
      );
    }

    if (fileRejections.length > 0) {
      fileRejections.map((rejectedFile) =>
        toast.error(rejectedFile.errors[0].message, { hideProgressBar: true, autoClose: 3000 })
      );
    }

    return () => {
      setAccepted(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedFiles.length, fileRejections.length]);

  return (
    <section>
      <div className="container" {...getRootProps({ style, className: 'dropzone' })}>
        <input {...getInputProps()} />

        <FilePicker.Signifiers signifier={accepted} feedback={null} cls="spinner-border text-azure" />
        <FilePicker.Signifiers
          signifier={!isDragAccept && !accepted & !isDragReject}
          feedback={'Drag & drop some files here, or click to select files'}
          cls={`${darkMode ? 'text-secondary' : 'text-dark'} mt-3`}
        />

        <FilePicker.Signifiers signifier={isDragAccept} feedback={'All files will be accepted'} cls="text-lime mt-3" />

        <FilePicker.Signifiers signifier={isDragReject} feedback={'Files will be rejected!'} cls="text-red mt-3" />
      </div>

      {acceptedFiles.length > 0 && (
        <FilePicker.AcceptedFiles>
          {acceptedFiles.map((acceptedFile, index) => (
            <FilePicker.Signifiers
              key={index}
              signifier={acceptedFiles.length > 0}
              feedback={acceptedFile.name}
              cls="text-secondary d-flex justify-content-star"
            />
          ))}
        </FilePicker.AcceptedFiles>
      )}
    </section>
  );
};

FilePicker.Signifiers = ({ signifier, feedback, cls }) => {
  if (signifier) {
    return <center>{feedback === null ? <div className={cls}></div> : <p className={cls}>{feedback}</p>}</center>;
  }

  return null;
};

FilePicker.AcceptedFiles = ({ children }) => {
  return (
    <aside>
      <span className="text-info">Files</span>
      <div className="row">{children}</div>
    </aside>
  );
};
