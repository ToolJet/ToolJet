import React, { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Upload,
  X,
} from 'lucide-react';
import { createFileFieldRef, registerFileHandle, releaseFileHandle } from '@/AppBuilder/_utils/fileHandleRegistry';
import { Field } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { list, useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { MUTED, isText } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';

// ---- File upload ---------------------------------------------------------------------------------------------------

const KIND_ICONS = {
  image: FileImage,
  pdf: FileText,
  sheet: FileSpreadsheet,
  text: FileText,
  archive: FileArchive,
  audio: FileAudio,
  video: FileVideo,
  other: FileIcon,
};

export const readAs = (file, how) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader[how](file);
  });

export let handleSeq = 0;

/** Reads a file the native File picker's way: text content, base64 and data URL, held in the file-handle registry
 *  (the store gets light string-like refs), plus parsed rows for CSV/TSV/Excel/JSON when parsing is on. */
export const readFile = async (file, { parse, parseFileType, delimiter }) => {
  const dataURL = await readAs(file, 'readAsDataURL');
  const content = await readAs(file, 'readAsText');
  const base64Data = dataURL.split(',')[1] || '';
  let parsedData = null;
  if (parse) {
    try {
      const fp = await import('@/AppBuilder/Widgets/FilePicker/helpers/fileProcessing');
      const type = parseFileType || 'auto-detect';
      if (fp.parseFileContentEnabled(file, type === 'auto-detect', type)) {
        parsedData = await fp.processFileContent(
          file.type,
          { readFileAsText: content, readFileAsDataURL: base64Data },
          { fileParsingDelimiter: delimiter || ',', fileTypeFromExtension: type }
        );
      }
    } catch {
      parsedData = null;
    }
  }
  handleSeq += 1;
  const handle = `shad-file-${Date.now().toString(36)}-${handleSeq}`;
  registerFileHandle(handle, file, { content, base64Data, dataURL });
  return {
    handle,
    name: String(file.name ?? ''),
    type: String(file.type ?? ''),
    size: Number(file.size) || 0,
    lastModified: file.lastModified,
    preview: String(file.type ?? '').startsWith('image/') ? dataURL : '',
    parsedData,
  };
};

export const exposedFile = (f) => ({
  name: f.name,
  type: f.type,
  size: f.size,
  lastModified: f.lastModified,
  content: createFileFieldRef(f.handle, 'content'),
  base64Data: createFileFieldRef(f.handle, 'base64Data'),
  dataURL: createFileFieldRef(f.handle, 'dataURL'),
  parsedData: f.parsedData,
});

export const DROPZONE =
  'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--lk-radius,var(--sc-radius))] border-2 border-dashed border-[color:var(--lk-invalid,var(--lk-drop-border,var(--sc-input)))] bg-[color:var(--lk-drop-bg,transparent)] px-6 py-5 text-center outline-none transition-colors hover:bg-[color:color-mix(in_srgb,var(--sc-muted)_50%,transparent)] focus-visible:ring-1 focus-visible:ring-ring';

export const ShadFileUpload = (props) => {
  const { properties, setExposedVariables, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const [files, setFiles] = useState([]);
  const filesRef = useRef(files);
  const mounted = useRef(true);
  const [parsing, setParsing] = useState(false);
  const [rejectError, setRejectError] = useState('');
  const multiple = properties.multiple !== false;
  const maxFiles = multiple ? M.clampFiles(properties.maxFiles) : 1;
  const maxSize = M.clampBytes(properties.maxSize);
  const minSize = M.clampBytes(properties.minSize);
  const disabled = busy(properties);
  const publish = (next) => {
    filesRef.current = next;
    setFiles(next);
    const exposed = next.map(exposedFile);
    // `file` is the native File picker's name for the list.
    setExposedVariables({ file: exposed, fileSize: next.reduce((sum, f) => sum + (f.size || 0), 0) });
  };
  // The native File picker's setFileName(index, name) or setFileName([{ index, newFileName }]): renames files and
  // keeps each one's extension.
  const rename = (indexOrUpdates, single) => {
    const updates = Array.isArray(indexOrUpdates)
      ? indexOrUpdates.slice(0, 1000).filter((u) => u && typeof u === 'object')
      : [{ index: indexOrUpdates, newFileName: single }];
    const names = new Map();
    for (const u of updates) {
      const name = typeof u.newFileName === 'string' ? u.newFileName.trim() : '';
      if (Number.isInteger(u.index) && name) names.set(u.index, name);
    }
    if (!names.size) return;
    const next = filesRef.current.map((f, i) => {
      if (!names.has(i)) return f;
      const dot = f.name.lastIndexOf('.');
      return { ...f, name: dot > 0 ? `${names.get(i)}${f.name.slice(dot)}` : names.get(i) };
    });
    publish(next);
  };
  const clearFiles = (withEvent = true) => {
    const old = filesRef.current;
    old.forEach((f) => releaseFileHandle(f.handle));
    setRejectError('');
    publish([]);
    if (withEvent && old.length) fireEvent('onFileDeselected');
  };
  const clearRef = useRef(clearFiles);
  clearRef.current = clearFiles;
  const renameRef = useRef(rename);
  renameRef.current = rename;
  useExposed(setExposedVariables, properties, {
    isParsing: parsing,
    label: String(properties.label ?? ''),
    clearFiles: async () => clearRef.current(),
    setFileName: async (indexOrUpdates, name) => renameRef.current(indexOrUpdates, name),
  });
  useEffect(() => {
    mounted.current = true;
    setExposedVariables({ file: [], fileSize: 0 });
    return () => {
      mounted.current = false;
      filesRef.current.forEach((f) => releaseFileHandle(f.handle));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const check = useValidation(props, files.length || '', () => clearFiles(false));

  const onDrop = async (accepted, rejections) => {
    check.touch();
    const current = multiple ? filesRef.current : [];
    const room = multiple ? Math.max(0, maxFiles - current.length) : 1;
    const fresh = list(accepted).filter(
      (f) => !current.some((c) => c.name === f.name && c.size === f.size && c.lastModified === f.lastModified)
    );
    const taking = fresh.slice(0, room);
    let message = M.rejectionMessage(rejections, { maxSize, minSize, maxFiles });
    if (!message && fresh.length > taking.length) {
      message = M.rejectionMessage([{ errors: [{ code: 'too-many-files' }] }], { maxFiles });
    }
    setRejectError(message);
    if (!taking.length) return;
    const parse = properties.parseContent === true;
    if (parse) {
      setParsing(true);
      setExposedVariables({ isParsing: true });
    }
    const options = { parse, parseFileType: properties.parseFileType, delimiter: properties.delimiter };
    const results = await Promise.allSettled(taking.map((f) => readFile(f, options)));
    const read = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    if (!mounted.current) {
      read.forEach((f) => releaseFileHandle(f.handle));
      return;
    }
    if (parse) {
      setParsing(false);
      setExposedVariables({ isParsing: false });
    }
    if (read.length < taking.length) setRejectError(`${taking.length - read.length} file(s) could not be read`);
    if (!read.length) return;
    if (!multiple) filesRef.current.forEach((f) => releaseFileHandle(f.handle));
    publish(multiple ? [...filesRef.current, ...read].slice(0, maxFiles) : read.slice(0, 1));
    fireEvent('onFileSelected');
    // The native File picker's event once the files are read (and parsed, with Parse content on).
    fireEvent('onFileLoaded');
  };
  const remove = (index) => {
    const file = filesRef.current[index];
    if (!file) return;
    releaseFileHandle(file.handle);
    setRejectError('');
    publish(filesRef.current.filter((_, i) => i !== index));
    fireEvent('onFileDeselected');
  };
  const full = multiple && files.length >= maxFiles;
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: M.toDropzoneAccept(properties.accept),
    maxSize: maxSize || undefined,
    minSize,
    multiple,
    disabled: disabled || full,
  });
  const hint =
    isText(properties.hint) && String(properties.hint).trim()
      ? String(properties.hint)
      : [
          M.acceptHint(properties.accept) || 'Any file',
          maxSize ? `up to ${M.formatBytes(maxSize)}` : '',
          multiple ? `max ${maxFiles} files` : '',
        ]
          .filter(Boolean)
          .join(' · ');
  const title = full
    ? `Limit of ${maxFiles} file${maxFiles === 1 ? '' : 's'} reached`
    : isDragActive
    ? 'Drop to upload'
    : String(properties.title ?? 'Drag & drop files here');
  return (
    <Shell {...props} innerRef={ref}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={rejectError || check.error}
        required={check.required}
      >
        <div className="flex flex-col gap-2">
          <div
            {...getRootProps({
              'aria-label': title,
              'aria-invalid': !!(rejectError || check.error) || undefined,
              className: cn(
                DROPZONE,
                isDragActive &&
                  'border-[color:var(--sc-primary)] bg-[color:color-mix(in_srgb,var(--sc-primary)_6%,transparent)]',
                isDragReject && 'border-[color:var(--lk-error,var(--sc-destructive))]',
                (disabled || full) && 'cursor-not-allowed opacity-60 hover:bg-transparent'
              ),
            })}
          >
            <input {...getInputProps({ id: `shad-${id}` })} />
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--lk-icon-bg,var(--sc-muted))]">
              {properties.loadingState || parsing ? (
                <Spinner />
              ) : (
                <Upload className="h-5 w-5 text-[color:var(--lk-icon,var(--sc-muted-foreground))]" />
              )}
            </div>
            <p className="m-0 text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]">{title}</p>
            {full ? null : (
              <p className={cn('m-0 text-sm', MUTED)}>
                or{' '}
                <span className="font-medium text-[color:var(--sc-primary-ink)] underline-offset-4 hover:underline">
                  click to browse
                </span>
              </p>
            )}
            <p className="m-0 text-xs text-[color:var(--lk-hint,var(--sc-muted-foreground))]">{hint}</p>
          </div>
          {files.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Selected files">
              {files.map((f, i) => {
                const Kind = KIND_ICONS[M.fileKind(f.type, f.name)] || FileIcon;
                const ext = (f.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toUpperCase();
                return (
                  <li
                    key={f.handle}
                    className="flex items-center gap-3 rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] border border-[color:var(--lk-item-border,var(--sc-border))] bg-[color:var(--lk-item-bg,var(--sc-card))] p-2 pr-1"
                  >
                    {properties.showPreview !== false && f.preview ? (
                      <img
                        src={f.preview}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md border border-[color:var(--sc-border)] object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color:var(--sc-muted)]">
                        <Kind className={cn('h-5 w-5', MUTED)} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-medium text-[color:var(--sc-foreground)]">{f.name}</p>
                      <p className={cn('m-0 text-xs', MUTED)}>
                        {M.formatBytes(f.size)}
                        {ext ? ` · ${ext}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn('h-8 w-8 shrink-0', MUTED)}
                      aria-label={`Remove ${f.name}`}
                      disabled={disabled}
                      onClick={() => remove(i)}
                    >
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </Field>
    </Shell>
  );
};

export default withControlState(ShadFileUpload);
