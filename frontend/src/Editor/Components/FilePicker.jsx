import React, { useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

export const FilePicker = ({ width, height, darkMode, properties, styles, fireEvent, setExposedVariable }) => {
  const { enableDropzone, enablePicker, enableMultiple, maxFileCount, fileType, maxSize, minSize } = properties;

  const { visibility, disabledState } = styles;

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
    display: visibility ? 'flex' : 'none',
    height,
    backgroundColor: !disabledState && bgThemeColor,
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
      accept: fileType,
      noClick: !enablePicker,
      noDrag: !enableDropzone,
      noKeyboard: true,
      maxFiles: maxFileCount,
      minSize: minSize,
      maxSize: maxSize,
      multiple: enableMultiple,
      disabled: disabledState,
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive && enableDropzone ? activeStyle : {}),
      ...(isDragAccept && enableDropzone ? acceptStyle : {}),
      ...(isDragReject && enableDropzone ? rejectStyle : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseStyle, isDragActive, isDragAccept, acceptStyle, isDragReject]
  );

  const [accepted, setAccepted] = React.useState(false);
  const [showSelectdFiles, setShowSelectedFiles] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState([]);

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

    return {
      name: file.name,
      type: file.type,
      content: readFileAsText,
      dataURL: readFileAsDataURL,
    };
  };

  useEffect(() => {
    if (acceptedFiles.length === 0) {
      setExposedVariable('file', []);
    }

    if (acceptedFiles.length !== 0) {
      const fileData = enableMultiple ? [...selectedFiles] : [];
      acceptedFiles.map((acceptedFile) => {
        const acceptedFileData = fileReader(acceptedFile);
        acceptedFileData.then((data) => {
          fileData.push(data);
        });
      });

      setSelectedFiles(fileData);
      setExposedVariable('file', fileData).then(() => {
        setAccepted(true);
        return new Promise(function (resolve) {
          setTimeout(() => {
            fireEvent('onFileSelected');
            setShowSelectedFiles(true);
            setAccepted(false);
            resolve();
          }, 600);
        });
      });
    }

    if (fileRejections.length > 0) {
      fileRejections.map((rejectedFile) => toast.error(rejectedFile.errors[0].message));
    }

    return () => {
      setAccepted(false);
      setShowSelectedFiles(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedFiles.length, fileRejections.length]);

  const clearSelectedFiles = (index) => {
    setSelectedFiles((prevState) => {
      const copy = JSON.parse(JSON.stringify(prevState));
      copy.splice(index, 1);
      return copy;
    });
  };

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setShowSelectedFiles(false);
    }
    setExposedVariable('file', selectedFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  return (
    <section>
      {showSelectdFiles ? (
        <FilePicker.AcceptedFiles
          width={width}
          height={height}
          showFilezone={setShowSelectedFiles}
          bgThemeColor={bgThemeColor}
        >
          {selectedFiles.map((acceptedFile, index) => (
            <>
              <div key={index} className="col-10">
                <FilePicker.Signifiers
                  signifier={selectedFiles.length > 0}
                  feedback={acceptedFile.name}
                  cls="text-secondary d-flex justify-content-start file-list"
                />
              </div>
              <div className="col-2 mt-1">
                <button
                  className="btn badge bg-azure-lt"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelectedFiles(index);
                  }}
                >
                  <img src="/assets/images/icons/trash.svg" width="12" height="12" className="mx-1" />
                </button>
              </div>
            </>
          ))}
        </FilePicker.AcceptedFiles>
      ) : (
        //* Dropzone
        <div className="container" {...getRootProps({ style, className: 'dropzone' })}>
          <input {...getInputProps()} />
          <FilePicker.Signifiers signifier={accepted} feedback={null} cls="spinner-border text-azure p-0" />
          <FilePicker.Signifiers
            signifier={!isDragAccept && !accepted & !isDragReject}
            feedback={'Drag & drop some files here, or click to select files'}
            cls={`${darkMode ? 'text-secondary' : 'text-dark'} mt-3`}
          />

          <FilePicker.Signifiers
            signifier={isDragAccept}
            feedback={'All files will be accepted'}
            cls="text-lime mt-3"
          />

          <FilePicker.Signifiers signifier={isDragReject} feedback={'Files will be rejected!'} cls="text-red mt-3" />
        </div>
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

FilePicker.AcceptedFiles = ({ children, width, height, showFilezone, bgThemeColor }) => {
  const styles = {
    borderWidth: 1.5,
    borderRadius: 2,
    borderColor: '#42536A',
    borderStyle: 'dashed',
    color: '#bdbdbd',
    outline: 'none',
    padding: '5px',
    overflowX: 'hidden',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    width,
    height,
    backgroundColor: bgThemeColor,
  };
  return (
    <aside style={styles} onClick={() => showFilezone(false)}>
      <span className="text-info">Files</span>
      <div className="row accepted-files">{children}</div>
    </aside>
  );
};
