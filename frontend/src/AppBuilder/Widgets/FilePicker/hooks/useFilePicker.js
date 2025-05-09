import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { formatFileSize } from '@/_helpers/utils';
import { processFileContent, parseFileContentEnabled } from '../helpers/fileProcessing';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';

// Define mapping from PRD File Type categories to accept patterns
const fileTypeCategoryMap = {
  'Any Files': null, // null or undefined means accept all
  'Image files': 'image/*, .jpeg, .png, .gif, .svg',
  'Document files': 'application/pdf, .doc, .docx, .ppt, .pptx',
  'Spreadsheet files': `
    .xls, .xlsx,
    application/vnd.ms-excel,
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  `,
  'Text files': 'text/plain, application/json, application/xml, text/csv',
  'Audio files': 'audio/*, .mp3, .wav, .flac',
  'Video files': 'video/*, .mp4, .mov, .avi',
  'Archive/Compressed files': '.zip, .rar, .7z, .tar',
  // Add other custom categories if necessary
};

export const useFilePicker = ({
  validation,
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  height,
  id, // id might be needed for events
  component, // component might be needed for events
}) => {
  const isInitialRender = useRef(true);

  // --- Resolved Properties ---
  const instructionText = properties?.instructionText ?? 'Drag and drop files here or click to select files';
  const enableDropzone = properties?.enableDropzone ?? true;
  const enablePicker = properties?.enablePicker ?? true;
  const enableMultiple = properties?.enableMultiple ?? false;
  const parseContent = properties.parseContent ?? false;
  const fileTypeFromExtension = properties.parseFileType ?? 'auto-detect';
  const labelText = properties.label ?? '';

  const initialLoading = properties.loadingState ?? false;
  const initialVisible = properties.visibility ?? true;
  const initialDisabled = properties.disabledState ?? false;

  const maxFileCount = validation?.maxFileCount ?? 2;
  const fileTypeCategory = validation?.fileType ?? 'Any Files';
  const maxSize = validation?.maxSize ?? 51200000;
  const minSize = validation?.minSize ?? 50;
  const minFileCount = validation?.minFileCount ?? 0;
  const isMandatory = validation?.enableValidation ?? false;

  // --- Resolved Styles ---
  const borderRadius = styles?.borderRadius ?? 8;
  const boxShadow = styles?.boxShadow;

  // --- Use useExposeState Hook ---
  const { isDisabled, isVisible, isLoading } = useExposeState(
    initialLoading,
    initialVisible,
    initialDisabled,
    setExposedVariables,
    setExposedVariable
  );

  // --- State ---
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState({});
  const [uploadingStatus, setUploadingStatus] = useState({});
  const [isParsing, setIsParsing] = useState(false);
  const [disablePicker, setDisablePicker] = useState(false);
  const [isMinCountMet, setIsMinCountMet] = useState(true);
  const [isMandatoryMet, setIsMandatoryMet] = useState(!isMandatory);
  const [isValid, setIsValid] = useState(!isMandatory);

  // Calculate total file size
  const totalFileSize = useMemo(() => {
    return selectedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  }, [selectedFiles]);

  // --- File Handling Logic ---
  const getFileData = useCallback((file, method = 'readAsText') => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => {
        console.error('FileReader Error:', error);
        if (error.name === 'NotReadableError') {
          toast.error(error.message);
        }
        reject(error);
      };
      if (method === 'readAsDataURL') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  }, []);

  const fileReader = useCallback(
    async (file) => {
      try {
        const readFileAsText = await getFileData(file, 'readAsText');
        const readFileAsDataURLResult = await getFileData(file, 'readAsDataURL');
        const base64Data = readFileAsDataURLResult.split(',')[1];

        const shouldProcessFileParsing =
          parseContent && parseFileContentEnabled(file, fileTypeFromExtension === 'auto-detect', fileTypeFromExtension);

        let parsedValue = null;
        if (shouldProcessFileParsing) {
          const contentForParsing = {
            readFileAsText: readFileAsText,
            readFileAsDataURL: base64Data,
          };
          parsedValue = processFileContent(file.type, contentForParsing);
        }

        return {
          lastModified: file.lastModified,
          lastModifiedDate: file.lastModifiedDate,
          name: file.name,
          size: file.size,
          type: file.type,
          webkitRelativePath: file.webkitRelativePath,
          content: readFileAsText,
          base64Data: base64Data,
          parsedValue: parsedValue,
        };
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        // Update status/errors directly here or ensure it's handled by caller
        setUploadingStatus((prev) => ({ ...prev, [file.name]: 'error' }));
        setFileErrors((prev) => ({ ...prev, [file.name]: error.message || 'Failed to read file' }));
        throw error; // Re-throw for Promise.allSettled
      }
    },
    [getFileData, parseContent, fileTypeFromExtension]
  );

  // Error Handling for Size
  const handleFileSizeErrors = useCallback(
    (rejectedFileSize, errorObj) => {
      const { code } = errorObj;
      const errorMessages = {
        'file-too-small': `File size ${formatFileSize(rejectedFileSize)} is too small. Minimum size is ${formatFileSize(
          minSize
        )}.`,
        'file-too-large': `File size ${formatFileSize(rejectedFileSize)} is too large. Maximum size is ${formatFileSize(
          maxSize
        )}.`,
      };
      return errorMessages[code] || errorObj.message;
    },
    [minSize, maxSize]
  );

  // --- Dropzone Setup ---
  const onDropRejected = useCallback(
    (rejectedFiles) => {
      const newErrors = { ...fileErrors };
      rejectedFiles.forEach(({ file, errors }) => {
        const errorMsg = handleFileSizeErrors(file.size, errors[0]);
        newErrors[file.name] = errorMsg || errors[0].message;
        toast.error(errorMsg || `File rejected: ${errors[0].message}`);
      });
      setFileErrors(newErrors);
    },
    [fileErrors, handleFileSizeErrors]
  );

  // Custom validator
  const validateFile = useCallback(
    (file) => {
      if (selectedFiles.some((existingFile) => existingFile.name === file.name && existingFile.size === file.size)) {
        return {
          code: 'duplicate-file',
          message: `File "${file.name}" is already selected.`,
        };
      }
      if (!enableMultiple && selectedFiles.length >= 1) {
        return {
          code: 'max-files-exceeded',
          message: `Only one file is allowed.`,
        };
      }
      if (enableMultiple && selectedFiles.length >= maxFileCount) {
        return {
          code: 'max-files-exceeded',
          message: `You can only upload up to ${maxFileCount} files.`,
        };
      }
      return null;
    },
    [selectedFiles, enableMultiple, maxFileCount]
  );

  const onDrop = useCallback(
    async (acceptedDropFiles) => {
      // Fire 'onFileSelected' event before processing
      fireEvent?.('onFileSelected');

      const currentFileNames = selectedFiles.map((f) => f.name);
      const newFilesToAdd = acceptedDropFiles.filter((f) => !currentFileNames.includes(f.name));

      if (parseContent) {
        setIsParsing(true);
        setExposedVariable?.('isParsing', true);
      }

      const processPromises = newFilesToAdd.map((file) => {
        setUploadingStatus((prev) => ({ ...prev, [file.name]: 'uploading' }));
        return fileReader(file);
      });

      const results = await Promise.allSettled(processPromises);

      const successfullyProcessedFiles = [];
      const currentErrors = { ...fileErrors }; // Use a local copy for this drop operation
      const currentStatuses = { ...uploadingStatus };

      results.forEach((result, index) => {
        const fileName = newFilesToAdd[index].name;
        if (result.status === 'fulfilled') {
          successfullyProcessedFiles.push(result.value);
          currentStatuses[fileName] = 'uploaded';
          if (currentErrors[fileName]) delete currentErrors[fileName]; // Clear previous error
        } else {
          const errorMsg = result.reason?.message || 'Failed to process file';
          currentErrors[fileName] = errorMsg;
          currentStatuses[fileName] = 'error';
          toast.error(`Error processing ${fileName}: ${errorMsg}`);
        }
      });

      setSelectedFiles((prevFiles) => {
        const updatedFiles = enableMultiple
          ? [...prevFiles, ...successfullyProcessedFiles]
          : [...successfullyProcessedFiles];
        return enableMultiple ? updatedFiles.slice(0, maxFileCount) : updatedFiles;
      });

      setFileErrors(currentErrors); // Update state with errors from this drop
      setUploadingStatus(currentStatuses); // Update state with statuses from this drop

      if (parseContent) {
        setIsParsing(false);
        setExposedVariable?.('isParsing', false);
      }

      // Fire 'onFileLoaded' event after processing
      if (fireEvent && successfullyProcessedFiles.length > 0) {
        fireEvent?.('onFileLoaded', { files: successfullyProcessedFiles });
      }
    },
    [
      selectedFiles,
      parseContent,
      fireEvent,
      setExposedVariable,
      fileReader,
      enableMultiple,
      maxFileCount,
      fileErrors,
      uploadingStatus,
    ]
  );

  // Calculate the accept prop based on the category
  const acceptProp = useMemo(() => {
    const pattern = fileTypeCategoryMap[fileTypeCategory];
    if (!pattern) {
      return null; // Accept all if pattern is null/undefined or category not found
    }
    // Convert comma-separated string to the object format react-dropzone expects
    return pattern.split(',').reduce((acc, type) => {
      const trimmedType = type.trim();
      if (trimmedType) acc[trimmedType] = [];
      return acc;
    }, {});
  }, [fileTypeCategory]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    accept: acceptProp, // Use the calculated accept prop
    noClick: !enablePicker || disablePicker,
    noDrag: !enableDropzone || disablePicker,
    noKeyboard: true,
    maxSize: maxSize,
    minSize: minSize,
    multiple: enableMultiple,
    disabled: isDisabled || disablePicker,
    onDropRejected: onDropRejected,
    validator: validateFile,
    onDrop: onDrop,
  });

  // Function to remove a file
  const handleRemoveFile = useCallback(
    (indexToRemove) => {
      const fileToRemove = selectedFiles[indexToRemove];
      if (!fileToRemove) return;

      setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));

      setFileErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fileToRemove.name];
        return newErrors;
      });
      setUploadingStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[fileToRemove.name];
        return newStatus;
      });

      fireEvent?.('onFileDeselected', { file: fileToRemove });
    },
    [selectedFiles, fireEvent]
  );

  // --- Exposed Actions ---
  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setFileErrors({});
    setUploadingStatus({});
  }, []);

  const setFileName = useCallback(
    (indexOrUpdates, newNameIfSingle) => {
      setSelectedFiles((currentFiles) => {
        let updateMap = {};
        if (Array.isArray(indexOrUpdates)) {
          // Batch update: [{index: number, newFileName: string}]
          indexOrUpdates.forEach((update) => {
            if (typeof update.index === 'number' && typeof update.newFileName === 'string') {
              updateMap[update.index] = update.newFileName.trim();
            }
          });
        } else if (typeof indexOrUpdates === 'number' && typeof newNameIfSingle === 'string') {
          // Single update: (index: number, newFileName: string)
          const index = indexOrUpdates;
          const newFileName = newNameIfSingle.trim();
          if (newFileName !== '') {
            updateMap[index] = newFileName;
          }
        }

        if (Object.keys(updateMap).length === 0) return currentFiles; // No valid updates

        return currentFiles.map((file, index) => {
          if (updateMap.hasOwnProperty(index)) {
            const newNameBase = updateMap[index];
            const currentNameParts = file.name.split('.');
            const extension = currentNameParts.length > 1 ? currentNameParts.pop() : null;
            const finalNewName = extension ? `${newNameBase}.${extension}` : newNameBase;
            // Ensure name doesn't become empty if base is empty and no extension
            if (finalNewName === '' || finalNewName === '.') return file;
            return { ...file, name: finalNewName };
          }
          return file;
        });
      });
    },
    [] // No dependencies needed
  );

  // --- Effects ---
  useEffect(() => {
    // Update exposed variables
    if (!isInitialRender.current) {
      const minMet = selectedFiles.length >= minFileCount;
      const mandatoryMet = !isMandatory || selectedFiles.length > 0;
      const currentIsValid = minMet && mandatoryMet;

      setIsMinCountMet(minMet);
      setIsMandatoryMet(mandatoryMet);
      setIsValid(currentIsValid);

      // useExposeState handles: isLoading, isVisible, isDisabled, setVisibility, setLoading, setDisable
      // We manually expose widget-specific items:
      setExposedVariables?.({
        clearFiles: clearFiles,
        setFileName: setFileName,
      });
      setExposedVariable?.('files', selectedFiles); // Contains parsedValue
      setExposedVariable?.('isParsing', isParsing);
      setExposedVariable?.('isMandatory', isMandatory);
      setExposedVariable?.('isValid', currentIsValid);
      setExposedVariable?.('fileSize', totalFileSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedFiles,
    isParsing,
    minFileCount,
    isMandatory,
    totalFileSize,
    clearFiles,
    setFileName,
    setExposedVariables,
    setExposedVariable,
  ]); // Multi-line dependencies

  useEffect(() => {
    // Initial setup only
    const initialIsValid = !isMandatory; // Calculate initial validity here
    // useExposeState handles initial exposure of common vars/setters
    // We manually expose widget-specific items initially:
    setExposedVariables?.({
      clearFiles: clearFiles,
      setFileName: setFileName,
    });
    setExposedVariable?.('files', []);
    setExposedVariable?.('isParsing', false);
    setExposedVariable?.('isMandatory', isMandatory);
    setExposedVariable?.('isValid', initialIsValid);
    setExposedVariable?.('fileSize', 0);

    setIsMandatoryMet(!isMandatory);
    setIsValid(initialIsValid); // Set initial state using the calculated value
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory, clearFiles, setFileName, setExposedVariables, setExposedVariable]); // Multi-line dependencies

  useEffect(() => {
    // Update internal disablePicker based on isDisabled from useExposeState and other logic
    const shouldDisable =
      isDisabled || // Use isDisabled from hook
      (enableMultiple && selectedFiles.length >= maxFileCount) ||
      (!enableMultiple && selectedFiles.length >= 1);
    setDisablePicker(shouldDisable);
    // Use isDisabled from useExposeState for dropzone disabled prop
  }, [selectedFiles.length, maxFileCount, enableMultiple, isDisabled]);

  // --- Styles for Dropzone ---
  // Moved style calculation to component as it depends on drag states from useDropzone return

  return {
    isVisible,
    isLoading,
    // Dropzone props
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    // File state
    selectedFiles,
    fileErrors,
    uploadingStatus,
    isParsing,
    // Actions
    handleRemoveFile,
    // Calculated state/props for component
    labelText,
    instructionText,
    disablePicker, // Needed for styling/cursor
    disabledState: isDisabled, // Return isDisabled from useExposeState
    borderRadius, // Needed for styling
    boxShadow, // Needed for styling
    height, // Needed for styling
    minSize,
    maxSize,
    isMandatory,
    minFileCount,
    maxFileCount,
    isMinCountMet,
    isMandatoryMet,
    clearFiles, // Return actions if needed internally (currently not)
    setFileName, // Return actions if needed internally (currently not)
  };
};
