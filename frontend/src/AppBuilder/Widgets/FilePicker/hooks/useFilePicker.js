import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { formatFileSize } from '@/_helpers/utils';
import { processFileContent, DEPRECATED_processFileContent, parseFileContentEnabled } from '../helpers/fileProcessing';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';

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
  const fileTypeCategory = validation?.fileType ?? '*/*';
  const maxSize = validation?.maxSize ?? 51200000;
  const minSize = validation?.minSize ?? 50;
  const minFileCount = validation?.minFileCount ?? 0;
  const isMandatory = validation?.enableValidation ?? false;

  // --- Resolved Styles ---
  const containerBackgroundColor = styles?.containerBackgroundColor ?? 'var(--color-surface-1)';
  const containerBorder = styles?.containerBorder ?? 'transparent';
  const containerBoxShadow = styles?.containerBoxShadow ?? 'none';
  const containerPadding = styles?.containerPadding ?? 16;
  const borderRadius = styles?.borderRadius ?? 8;

  const dropzoneTitleColor = styles?.dropzoneTitleColor ?? 'var(--text-primary';
  const dropzoneActiveColor = styles?.dropzoneActiveColor ?? 'var(--file-picker-primary-brand)';
  const dropzoneErrorColor = styles?.dropzoneErrorColor ?? 'var(--status-error)';
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
  const [dropzoneRejections, setDropzoneRejections] = useState([]);
  const [uiErrorMessage, setUiErrorMessage] = useState('');

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
        let parsedData = null;
        if (shouldProcessFileParsing) {
          const contentForParsing = {
            readFileAsText: readFileAsText,
            readFileAsDataURL: base64Data,
          };
          parsedValue = processFileContent(file.type, contentForParsing);
          parsedData = DEPRECATED_processFileContent(file.type, contentForParsing);
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
          parsedData: parsedData,
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
      // For UI display, decide on one message
      if (rejectedFiles.length === 1) {
        const { file, errors } = rejectedFiles[0];
        const error = errors[0];
        let specificMessage = error.message;
        // Generate specific message (similar to existing logic but for a single error)
        switch (error.code) {
          case 'file-invalid-type':
            specificMessage = `The file "${file.name}" has an unsupported file type.`;
            if (fileTypeCategory && fileTypeCategory !== '*/*') {
              specificMessage += ` Please upload files of type: ${fileTypeCategory}.`;
            }
            break;
          case 'file-too-small':
            specificMessage = `The file "${file.name}" (${formatFileSize(file.size)}) is smaller than the minimum allowed size of ${formatFileSize(minSize)}.`;
            break;
          case 'file-too-large':
            specificMessage = `The file "${file.name}" (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(maxSize)}.`;
            break;
          case 'too-many-files':
            specificMessage = `You can select a maximum of ${maxFileCount} files.`;
            break;
          case 'duplicate-file':
            specificMessage = `The file "${file.name}" has already been selected.`;
            break;
          default:
            specificMessage = error.message && typeof error.message === 'string' && error.message.trim() !== ''
              ? error.message
              : `An issue occurred with file "${file.name}".`;
            break;
        }
        setUiErrorMessage(specificMessage);
        toast.error(specificMessage); // Toast the specific error
      } else if (rejectedFiles.length > 1) {
        const genericMessage = 'Multiple files have errors. Please check the requirements.';
        setUiErrorMessage(genericMessage);
        // Toast individual errors if desired, or one generic toast
        rejectedFiles.forEach(({ file, errors }) => {
          // Simplified toast for multiple errors, could be more detailed
          toast.error(`Error with ${file.name}: ${errors[0].message}`);
        });
      }
      // dropzoneRejections state can be kept raw for other potential uses or removed if only for this UI message
      setDropzoneRejections(rejectedFiles); // Keep raw rejections for potential debugging or detailed listing elsewhere
    },
    [fileTypeCategory, minSize, maxSize, maxFileCount, setExposedVariable]
  );

  // Custom validator
  const validateFile = useCallback(
    (file) => {
      // Check 1: Duplicate file
      if (selectedFiles.some((existingFile) => existingFile.name === file.name && existingFile.size === file.size)) {
        return {
          code: 'duplicate-file',
          message: `The file "${file.name}" has already been selected.`,
        };
      }

      // Check 2: If single file mode and a file is already selected
      if (!enableMultiple && selectedFiles.length >= 1) {
        return {
          code: 'max-files-exceeded',
          message: `Only one file can be uploaded.`,
        };
      }

      // Check 3: If multiple file mode and max file count is already reached
      if (enableMultiple && selectedFiles.length >= maxFileCount) {
        return {
          code: 'max-files-exceeded',
          message: `You can only upload up to ${maxFileCount} files.`,
        };
      }

      return null; // File passes custom validation
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

      // Clear dropzone rejections when new files are accepted
      if (acceptedDropFiles.length > 0) {
        setDropzoneRejections([]);
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
    const pattern = fileTypeCategory;
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
      setExposedVariable?.('file', selectedFiles); // Contains parsedValue
      setExposedVariable?.('isParsing', isParsing);
      setExposedVariable?.('isMandatory', isMandatory);
      setExposedVariable?.('isValid', currentIsValid);
      setExposedVariable?.('fileSize', totalFileSize);
      setExposedVariable?.('uiErrorMessage', uiErrorMessage);
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
    uiErrorMessage,
    dropzoneRejections,
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
    setExposedVariable?.('file', []);
    setExposedVariable?.('isParsing', false);
    setExposedVariable?.('isMandatory', isMandatory);
    setExposedVariable?.('isValid', initialIsValid);
    setExposedVariable?.('fileSize', 0);
    setExposedVariable?.('uiErrorMessage', '');

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
    dropzoneRejections,
    isParsing,
    // Actions
    handleRemoveFile,
    // Calculated state/props for component
    labelText,
    instructionText,
    disablePicker, // Needed for styling/cursor
    disabledState: isDisabled, // Return isDisabled from useExposeState
    borderRadius, // Needed for styling
    containerBackgroundColor,
    containerBorder,
    containerBoxShadow,
    containerPadding,
    dropzoneTitleColor,
    dropzoneActiveColor,
    dropzoneErrorColor,
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
    uiErrorMessage, // Return new state
  };
};
