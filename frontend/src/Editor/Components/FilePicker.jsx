import React, { useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx/xlsx.mjs';

export const FilePicker = ({
  id,
  width,
  height,
  component,
  currentState,
  onComponentOptionChanged,
  onEvent,
  darkMode,
  styles,
  registerAction,
  dataCy,
}) => {
  //* properties definitions
  const instructionText =
    component.definition.properties.instructionText?.value ?? 'Drag and Drop some files here, or click to select files';
  const enableDropzone = component.definition.properties.enableDropzone.value ?? true;
  const enablePicker = component.definition.properties?.enablePicker?.value ?? true;
  const maxFileCount = component.definition.properties.maxFileCount?.value ?? 2;
  const enableMultiple = component.definition.properties.enableMultiple?.value ?? false;
  const fileType = component.definition.properties.fileType?.value ?? 'image/*';
  const maxSize = component.definition.properties.maxSize?.value ?? 1048576;
  const minSize = component.definition.properties.minSize?.value ?? 0;
  const parseContent = resolveWidgetFieldValue(
    component.definition.properties.parseContent?.value ?? false,
    currentState
  );
  const fileTypeFromExtension = component.definition.properties.parseFileType?.value ?? 'auto-detect';
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
  //* styles definitions
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
    borderRadius: `${styles.borderRadius}px`,
    borderColor: '#42536A',
    borderStyle: 'dashed',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
    display: parsedWidgetVisibility ? 'flex' : 'none',
    height,
    backgroundColor: !parsedDisabledState && bgThemeColor,
    boxShadow: styles.boxShadow,
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

  const [disablePicker, setDisablePicker] = React.useState(false);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, acceptedFiles, fileRejections } =
    useDropzone({
      accept: { parsedFileType: [parsedFileType] },
      noClick: !parsedEnablePicker || disablePicker,
      noDrag: !parsedEnableDropzone || disablePicker,
      noKeyboard: true,
      maxFiles: parsedMaxFileCount,
      minSize: parsedMinSize,
      maxSize: parsedMaxSize,
      multiple: parsedEnableMultiple,
      disabled: disablePicker,
      validator: validateFileExists,
      onDropRejected: () => (selectedFiles.length > 0 ? setShowSelectedFiles(true) : setShowSelectedFiles(false)),
      onFileDialogCancel: () => (selectedFiles.length > 0 ? setShowSelectedFiles(true) : setShowSelectedFiles(false)),
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
  const [showSelectedFiles, setShowSelectedFiles] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState([]);

  //* custom validator
  function validateFileExists(_file) {
    const selectedFilesCount = selectedFiles.length;

    if (selectedFilesCount === parsedMaxFileCount) {
      return {
        code: 'max_file_count_reached',
        message: `Max file count reached`,
      };
    }

    return null;
  }

  useEffect(() => {
    if (parsedDisabledState) setDisablePicker(true);

    if (selectedFiles.length === parsedMaxFileCount && parsedEnableMultiple) {
      setDisablePicker(true);
    } else {
      setDisablePicker(false);
    }
  }, [selectedFiles.length, parsedDisabledState, parsedMaxFileCount, parsedEnableMultiple]);

  /**
   * *getFileData()
   * @param {*} file
   * @param {*} method: readAsDataURL, readAsText
   */
  const getFileData = (file = {}, method = 'readAsText') => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (result) => {
        resolve([result, reader]);
      };
      reader[method](file);
      reader.onerror = (error) => {
        reject(error);
        if (error.name == 'NotReadableError') {
          toast.error(error.message);
        }
      };
    }).then((result) => {
      if (method === 'readAsDataURL') {
        return result[0].srcElement.result.split(',')[1];
      }
      return result[0].srcElement.result;
    });
  };

  const fileReader = async (file) => {
    // * readAsText
    const readFileAsText = await getFileData(file);

    // * readAsDataURL
    const readFileAsDataURL = await getFileData(file, 'readAsDataURL');
    const autoDetectFileType = fileTypeFromExtension === 'auto-detect';

    // * parse file content
    const shouldProcessFileParsing = parseContent
      ? await parseFileContent(file, autoDetectFileType, fileTypeFromExtension)
      : false;

    return {
      name: file.name,
      type: file.type,
      content: readFileAsText,
      dataURL: readFileAsDataURL, // TODO: Fix dataURL to have correct format
      base64Data: readFileAsDataURL,
      parsedData: shouldProcessFileParsing
        ? await processFileContent(file.type, { readFileAsDataURL, readFileAsText })
        : null,
      filePath: file.path,
    };
  };

  const handleFileRejection = (fileRejections) => {
    const uniqueFileRejecetd = fileRejections.reduce((acc, rejectedFile) => {
      if (!acc.includes(rejectedFile.errors[0].message)) {
        acc.push(handleFileSizeErorrs(rejectedFile.file.size, rejectedFile.errors[0]));
      }
      return acc;
    }, []);
    if (selectedFiles.length > 0) {
      setShowSelectedFiles(true);
    }
    uniqueFileRejecetd.map((rejectedMessag) => toast.error(rejectedMessag));
  };

  //** checks error codes for max and min size  */
  const handleFileSizeErorrs = (rejectedFileSize, errorObj) => {
    const { message, code } = errorObj;

    const errorType = Object.freeze({
      MIN_SIZE: 'file-too-small',
      MAX_SIZE: 'file-too-large',
    });

    const fileSize = formatFileSize(rejectedFileSize);

    if (code === errorType.MIN_SIZE) {
      return `File size ${fileSize} is too small. Minimum size is ${formatFileSize(parsedMinSize)}`;
    }
    if (code === errorType.MAX_SIZE) {
      return `File size ${fileSize} is too large. Maximum size is ${formatFileSize(parsedMaxSize)}`;
    }

    return message;
  };

  useEffect(() => {
    if (acceptedFiles.length === 0 && selectedFiles.length === 0) {
      onComponentOptionChanged(component, 'file', [], id);
    }

    if (acceptedFiles.length !== 0) {
      const fileData = parsedEnableMultiple ? [...selectedFiles] : [];
      if (parseContent) {
        onComponentOptionChanged(component, 'isParsing', true, id);
      }
      acceptedFiles.map((acceptedFile) => {
        const acceptedFileData = fileReader(acceptedFile);
        acceptedFileData.then((data) => {
          if (fileData.length < parsedMaxFileCount) {
            fileData.push(data);
          }
        });
      });
      setSelectedFiles(fileData);
      onComponentOptionChanged(component, 'file', fileData, id);
      onEvent('onFileSelected', { component })
        .then(() => {
          setAccepted(true);
          // eslint-disable-next-line no-unused-vars
          return new Promise(function (resolve, reject) {
            setTimeout(() => {
              setShowSelectedFiles(true);
              setAccepted(false);
              onComponentOptionChanged(component, 'isParsing', false, id);
              resolve();
            }, 600);
          });
        })
        .then(() => onEvent('onFileLoaded', { component }));
    }

    if (fileRejections.length > 0) {
      handleFileRejection(fileRejections);
    }

    return () => {
      if (selectedFiles.length === 0) {
        setShowSelectedFiles(false);
      }
      setAccepted(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedFiles.length, fileRejections.length]);

  const clearSelectedFiles = (index) => {
    setSelectedFiles((prevState) => {
      const copy = JSON.parse(JSON.stringify(prevState));
      copy.splice(index, 1);
      return copy;
    });
    onEvent('onFileDeselected', { component });
  };

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setShowSelectedFiles(false);
    }
    onComponentOptionChanged(component, 'file', selectedFiles, id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  registerAction(
    'clearFiles',
    async function () {
      setSelectedFiles([]);
    },
    [setSelectedFiles]
  );

  return (
    <section>
      <div className="container" {...getRootProps({ style, className: 'dropzone' })} data-cy={dataCy}>
        <input {...getInputProps()} />
        <FilePicker.Signifiers signifier={accepted} feedback={null} cls="spinner-border text-azure p-0" />

        {showSelectedFiles && !accepted ? (
          <FilePicker.AcceptedFiles width={width - 10} height={height}>
            {selectedFiles.map((acceptedFile, index) => (
              <>
                <div key={index} className="col-10">
                  <FilePicker.Signifiers
                    signifier={selectedFiles.length > 0}
                    feedback={acceptedFile.name}
                    cls={`${darkMode ? 'text-light' : 'text-secondary'} d-flex justify-content-start file-list mb-2`}
                  />
                </div>
                <div className="col-2 mt-0">
                  <button
                    className="btn badge bg-azure-lt"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelectedFiles(index);
                    }}
                  >
                    <img src="assets/images/icons/trash.svg" width="12" height="12" className="mx-1" />
                  </button>
                </div>
              </>
            ))}
          </FilePicker.AcceptedFiles>
        ) : (
          <FilePicker.Signifiers
            signifier={!isDragAccept && !accepted & !isDragReject}
            feedback={instructionText}
            cls={`${darkMode ? 'text-light' : 'text-dark'} mt-3`}
          />
        )}

        <FilePicker.Signifiers
          signifier={isDragAccept && !(selectedFiles.length === parsedMaxFileCount)}
          feedback={'All files will be accepted'}
          cls="text-lime mt-3"
        />
        <FilePicker.Signifiers
          signifier={isDragAccept && selectedFiles.length === parsedMaxFileCount}
          feedback={'Max file reached!'}
          cls="text-red mt-3"
        />

        <FilePicker.Signifiers signifier={isDragReject} feedback={'Files will be rejected!'} cls="text-red mt-3" />
      </div>
    </section>
  );
};

FilePicker.Signifiers = ({ signifier, feedback, cls }) => {
  if (signifier) {
    return <>{feedback === null ? <center className={cls}></center> : <p className={cls}>{feedback}</p>}</>;
  }

  return null;
};

FilePicker.AcceptedFiles = ({ children, width, height }) => {
  const styles = {
    color: '#bdbdbd',
    outline: 'none',
    padding: '5px',
    overflowX: 'hidden',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    width,
    height,
  };
  return (
    <aside style={styles}>
      <span className="text-info">Files</span>
      <div className="row accepted-files">{children}</div>
    </aside>
  );
};

const processCSV = (str, delimiter = ',') => {
  try {
    const wb = XLSX.read(str, { type: 'string', raw: true });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json(ws, { delimiter, defval: '' });
    return data;
  } catch (error) {
    console.log(error);
    handleErrors(error);
  }
};

const processXls = (str) => {
  try {
    const wb = XLSX.read(str, { type: 'base64' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    /* Convert array of arrays */
    const data = XLSX.utils.sheet_to_json(ws);
    return data;
  } catch (error) {
    console.log(error);
    handleErrors(error);
  }
};

const processFileContent = (fileType, fileContent) => {
  switch (fileType) {
    case 'text/csv':
      return processCSV(fileContent.readFileAsText);
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return processXls(fileContent.readFileAsDataURL);

    default:
      break;
  }
};

const parseFileContent = (file, autoDetect = false, parseFileType) => {
  const fileType = file.type.split('/')[1];

  if (autoDetect) {
    return detectParserFile(file);
  } else {
    return fileType === parseFileType;
  }
};

const detectParserFile = (file) => {
  return (
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
};

//? handle bad data in csv parser (e.g. empty cells) OR errors
const handleErrors = (data) => {
  const badData = data.filter((row) => {
    return Object.values(row).some((value) => value === '');
  });

  const errors = data.filter((row) => {
    return Object.values(row).some((value) => value === 'ERROR');
  });

  return [badData, errors];
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 bytes';
  var k = 1000,
    dm = 2,
    sizes = ['Bytes', 'KB', 'MB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
