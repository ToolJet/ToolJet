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
import { FormField, controlAria } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import { useAutoHeight, useExposed, useLatest, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/fileModel';
import { MUTED } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import type { FileRejection } from 'react-dropzone';
import type { LucideIcon } from 'lucide-react';
import type { FileKind } from '@/AppBuilder/Widgets/Ui2/_pickers/fileModel';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isStringOrNumber, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- File upload ---------------------------------------------------------------------------------------------------

const KIND_ICONS: Record<FileKind, LucideIcon> = {
  image: FileImage,
  pdf: FileText,
  sheet: FileSpreadsheet,
  text: FileText,
  archive: FileArchive,
  audio: FileAudio,
  video: FileVideo,
  other: FileIcon,
};

export const readAs = (file: Blob, how: 'readAsDataURL' | 'readAsText') =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader[how](file);
  });

export let handleSeq = 0;

/** A file the widget has read: its registry handle, what the list shows, and the parsed rows (when parsing is on). */
export interface ReadFile {
  handle: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  preview: string;
  parsedData: unknown;
}

/** Reads a file the native File picker's way: text content, base64 and data URL, held in the file-handle registry
 *  (the store gets light string-like refs), plus parsed rows for CSV/TSV/Excel/JSON when parsing is on. */
export const readFile = async (
  file: File,
  { parse, parseFileType, delimiter }: { parse: boolean; parseFileType?: unknown; delimiter?: unknown }
): Promise<ReadFile> => {
  const dataURL = await readAs(file, 'readAsDataURL');
  const content = await readAs(file, 'readAsText');
  const base64Data = dataURL.split(',')[1] || '';
  let parsedData: unknown = null;
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

export const exposedFile = (f: ReadFile) => ({
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
  'tw-flex tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-border-2 tw-border-dashed tw-border-[color:var(--lk-invalid,var(--lk-drop-border,var(--sc-input)))] tw-bg-[color:var(--lk-drop-bg,transparent)] tw-px-6 tw-py-5 tw-text-center tw-outline-none tw-transition-colors hover:tw-bg-[color:color-mix(in_srgb,var(--sc-muted)_50%,transparent)] focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring';

export const ShadFileUpload = (props: WidgetProps) => {
  const { properties, setExposedVariables, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const [files, setFiles] = useState<ReadFile[]>([]);
  const filesRef = useRef(files);
  const mounted = useRef(true);
  const [parsing, setParsing] = useState(false);
  const [rejectError, setRejectError] = useState('');
  const multiple = properties.multiple !== false;
  const maxFiles = multiple ? M.clampFiles(properties.maxFiles) : 1;
  const maxSize = M.clampBytes(properties.maxSize);
  const minSize = M.clampBytes(properties.minSize);
  const disabled = busy(properties);
  const publish = (next: ReadFile[]) => {
    filesRef.current = next;
    setFiles(next);
    const exposed = next.map(exposedFile);
    // `file` is the native File picker's name for the list.
    setExposedVariables({ file: exposed, fileSize: next.reduce((sum, f) => sum + (f.size || 0), 0) });
  };
  // The native File picker's setFileName(index, name) or setFileName([{ index, newFileName }]): renames files and
  // keeps each one's extension.
  const rename = (indexOrUpdates: unknown, single?: unknown) => {
    const updates: Resolved[] = Array.isArray(indexOrUpdates)
      ? indexOrUpdates.slice(0, 1000).filter((u) => u && typeof u === 'object')
      : [{ index: indexOrUpdates, newFileName: single }];
    const names = new Map<number, string>();
    for (const u of updates) {
      const name = typeof u.newFileName === 'string' ? u.newFileName.trim() : '';
      if (Number.isInteger(u.index) && name) names.set(u.index, name);
    }
    if (!names.size) return;
    const next = filesRef.current.map((f, i) => {
      const newName = names.get(i);
      if (newName === undefined) return f;
      const dot = f.name.lastIndexOf('.');
      return { ...f, name: dot > 0 ? `${newName}${f.name.slice(dot)}` : newName };
    });
    publish(next);
  };
  // Reads in flight belong to a generation: clearing starts a new one, so a read that finishes after a clear is
  // released, not published (a cleared file came back, with its load events).
  const generation = useRef(0);
  const clearFiles = (withEvent = true) => {
    generation.current += 1;
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
    setFileName: async (indexOrUpdates: unknown, name: unknown) => renameRef.current(indexOrUpdates, name),
  });
  // Runs once: the widget opens empty, and its file handles are released when it goes.
  const exposeRef = useLatest(setExposedVariables);
  useEffect(() => {
    mounted.current = true;
    exposeRef.current({ file: [], fileSize: 0 });
    return () => {
      mounted.current = false;
      filesRef.current.forEach((f) => releaseFileHandle(f.handle));
    };
  }, [exposeRef]);
  const check = useValidation(props, files.length || '', () => clearFiles(false));

  const onDrop = async (accepted: File[], rejections: FileRejection[]) => {
    check.touch();
    const started = generation.current;
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
    const read = results
      .filter((r): r is PromiseFulfilledResult<ReadFile> => r.status === 'fulfilled')
      .map((r) => r.value);
    if (!mounted.current) {
      read.forEach((f) => releaseFileHandle(f.handle));
      return;
    }
    if (parse) {
      setParsing(false);
      setExposedVariables({ isParsing: false });
    }
    if (started !== generation.current) {
      read.forEach((f) => releaseFileHandle(f.handle));
      return;
    }
    if (read.length < taking.length) setRejectError(`${taking.length - read.length} file(s) could not be read`);
    if (!read.length) return;
    if (!multiple) filesRef.current.forEach((f) => releaseFileHandle(f.handle));
    // The files are put together when the reads finish, not when they start: two drops can both have seen room for
    // the last file, or both carried the same file. What does not fit is released, so its payload is not kept.
    const kept = multiple ? filesRef.current : [];
    const same = (a: ReadFile, b: ReadFile) =>
      a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    const added = read.filter((f, i) => !kept.some((k) => same(k, f)) && read.findIndex((g) => same(g, f)) === i);
    const next = [...kept, ...added].slice(0, maxFiles);
    read.filter((f) => !next.includes(f)).forEach((f) => releaseFileHandle(f.handle));
    if (added.length > next.length - kept.length) {
      setRejectError(M.rejectionMessage([{ errors: [{ code: 'too-many-files' }] }], { maxFiles }));
    }
    if (next.length === kept.length && multiple) return;
    publish(next);
    fireEvent('onFileSelected');
    // The native File picker's event once the files are read (and parsed, with Parse content on).
    fireEvent('onFileLoaded');
  };
  const remove = (index: number) => {
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
    isStringOrNumber(properties.hint) && String(properties.hint).trim()
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
    <FormField props={props} properties={properties} check={check} innerRef={ref} error={rejectError || check.error}>
      <div className="tw-flex tw-flex-col tw-gap-2">
        <div
          {...getRootProps({
            'aria-label': title,
            ...controlAria(props, rejectError || check.error),
            className: cn(
              DROPZONE,
              isDragActive &&
                'tw-border-[color:var(--sc-primary)] tw-bg-[color:color-mix(in_srgb,var(--sc-primary)_6%,transparent)]',
              isDragReject && 'tw-border-[color:var(--lk-error,var(--sc-destructive))]',
              (disabled || full) && 'tw-cursor-not-allowed tw-opacity-60 hover:tw-bg-transparent'
            ),
          })}
        >
          <input {...getInputProps({ id: `shad-${id}` })} />
          <div className="tw-mb-1 tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-[color:var(--lk-icon-bg,var(--sc-muted))]">
            {properties.loadingState || parsing ? (
              <Spinner />
            ) : (
              <Upload className="tw-h-5 tw-w-5 tw-text-[color:var(--lk-icon,var(--sc-muted-foreground))]" />
            )}
          </div>
          <p className="tw-m-0 tw-text-ui2-sm tw-font-medium tw-text-[color:var(--lk-title,var(--sc-foreground))]">
            {title}
          </p>
          {full ? null : (
            <p className={cn('tw-m-0 tw-text-ui2-sm', MUTED)}>
              or{' '}
              <span className="tw-font-medium tw-text-[color:var(--sc-primary-ink)] tw-underline-offset-4 hover:tw-underline">
                click to browse
              </span>
            </p>
          )}
          <p className="tw-m-0 tw-text-xs tw-text-[color:var(--lk-hint,var(--sc-muted-foreground))]">{hint}</p>
        </div>
        {files.length ? (
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0" aria-label="Selected files">
            {files.map((f, i) => {
              const Kind = KIND_ICONS[M.fileKind(f.type, f.name)] || FileIcon;
              const ext = (f.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toUpperCase();
              return (
                <li
                  key={f.handle}
                  className="tw-flex tw-items-center tw-gap-3 tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] tw-border tw-border-[color:var(--lk-item-border,var(--sc-border))] tw-bg-[color:var(--lk-item-bg,var(--sc-card))] tw-p-2 tw-pr-1"
                >
                  {properties.showPreview !== false && f.preview ? (
                    <img
                      src={f.preview}
                      alt=""
                      className="tw-h-10 tw-w-10 tw-shrink-0 tw-rounded-ui2-md tw-border tw-border-[color:var(--sc-border)] tw-object-cover"
                    />
                  ) : (
                    <span className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-md tw-bg-[color:var(--sc-muted)]">
                      <Kind className={cn('tw-h-5 tw-w-5', MUTED)} />
                    </span>
                  )}
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-m-0 tw-truncate tw-text-ui2-sm tw-font-medium tw-text-[color:var(--sc-foreground)]">
                      {f.name}
                    </p>
                    <p className={cn('tw-m-0 tw-text-xs', MUTED)}>
                      {M.formatBytes(f.size)}
                      {ext ? ` · ${ext}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn('tw-h-8 tw-w-8 tw-shrink-0', MUTED)}
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
    </FormField>
  );
};

export default withControlState(ShadFileUpload);
