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
import { createFileFieldRef, releaseFileHandle } from '@/AppBuilder/_utils/fileHandleRegistry';
import { controlAria, fieldIdOf, FormField } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  runNow,
  useAutoHeight,
  useExposed,
  useLatest,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/fileModel';
import { MUTED } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import type { FileRejection } from 'react-dropzone';
import type { LucideIcon } from 'lucide-react';
import type { FileKind } from '@/AppBuilder/Widgets/Ui2/_pickers/fileModel';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isStringOrNumber, list } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { readFile } from './fileRead';
import type { ReadFile } from './fileRead';

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

export const exposedFile = (f: ReadFile) => ({
  name: f.name,
  type: f.type,
  size: f.size,
  lastModified: f.lastModified,
  content: createFileFieldRef(f.handle, 'content'),
  base64Data: createFileFieldRef(f.handle, 'base64Data'),
  dataURL: createFileFieldRef(f.handle, 'dataURL'),
  parsedData: f.parsedData,
  parseError: f.parseError,
});

export const DROPZONE =
  'tw-flex tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-[var(--lk-radius,var(--sc-radius))] tw-border-2 tw-border-dashed tw-border-[color:var(--lk-invalid,var(--lk-drop-border,var(--sc-input)))] tw-bg-[color:var(--lk-drop-bg,transparent)] tw-px-6 tw-py-5 tw-text-center tw-outline-none tw-transition-colors hover:tw-bg-[color:color-mix(in_srgb,var(--sc-muted)_50%,transparent)] focus-visible:tw-ring-1 focus-visible:tw-ring-ui2-ring';

export const ShadFileUpload = (props: WidgetProps) => {
  const { properties, setExposedVariables, fireEvent } = props;
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
  // Who owns a read in flight, checked when it finishes:
  // - a generation, which clearing ends: a read that finishes after a clear is released, not published (a cleared
  //   file came back, with its load events);
  // - its place in the order of drops: with one file allowed, a read older than the latest drop is released (an older
  //   read finishing last replaced the newer selection);
  // - isParsing counts the parsing reads of the current generation, so it stays true until the last one finishes (the
  //   first read to finish, or one cleared away, turned it off while another was still parsing).
  // Ending a generation (clearing), unmounting or, with one file allowed, choosing a newer file also aborts the reads
  // under way, so a file no longer wanted is not read on or parsed only to be released; the checks below still decide
  // what is published. Each batch of reads holds its number of files, the places it takes against maxFiles.
  const generation = useRef(0);
  const reads = useRef(new Map<AbortController, number>());
  const stopReads = () => {
    reads.current.forEach((_, r) => r.abort());
    reads.current.clear();
  };
  const latestDrop = useRef(0);
  const parsingReads = useRef(0);
  const countParsing = (delta: number) => {
    const was = parsingReads.current > 0;
    parsingReads.current = delta === 0 ? 0 : Math.max(0, parsingReads.current + delta);
    const now = parsingReads.current > 0;
    if (now === was) return;
    setParsing(now);
    setExposedVariables({ isParsing: now });
  };
  // The limits in force when a read finishes apply, not those when it started (maxFiles or multiple can change while
  // a read is pending).
  const limits = useLatest({ multiple, maxFiles });
  const clearFiles = (withEvent = true) => {
    generation.current += 1;
    stopReads();
    countParsing(0);
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
      stopReads();
      filesRef.current.forEach((f) => releaseFileHandle(f.handle));
    };
  }, [exposeRef]);
  const check = useValidation(props, files.length || '', () => clearFiles(false));

  const onDrop = async (accepted: File[], rejections: FileRejection[]) => {
    check.touch();
    const started = generation.current;
    const current = multiple ? filesRef.current : [];
    // Reads still pending hold their places: drops made before they finish could otherwise start a read each.
    let pending = 0;
    reads.current.forEach((n) => (pending += n));
    const room = multiple ? Math.max(0, maxFiles - current.length - pending) : 1;
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
    if (!multiple) stopReads();
    latestDrop.current += 1;
    const drop = latestDrop.current;
    const parse = properties.parseContent === true;
    if (parse) countParsing(1);
    const batch = new AbortController();
    reads.current.set(batch, taking.length);
    const options = {
      parse,
      parseFileType: properties.parseFileType,
      delimiter: properties.delimiter,
      signal: batch.signal,
    };
    const results = await Promise.allSettled(taking.map((f) => readFile(f, options)));
    reads.current.delete(batch);
    const read = results
      .filter((r): r is PromiseFulfilledResult<ReadFile> => r.status === 'fulfilled')
      .map((r) => r.value);
    const release = () => read.forEach((f) => releaseFileHandle(f.handle));
    if (!mounted.current) return release();
    if (started !== generation.current) return release();
    if (parse) countParsing(-1);
    const live = limits.current;
    if (batch.signal.aborted || (!live.multiple && drop !== latestDrop.current)) return release();
    if (read.length < taking.length) setRejectError(`${taking.length - read.length} file(s) could not be read`);
    if (!read.length) return undefined;
    if (!live.multiple) filesRef.current.forEach((f) => releaseFileHandle(f.handle));
    // The files are put together when the reads finish, not when they start: two drops can both have seen room for
    // the last file, or both carried the same file. What does not fit is released, so its payload is not kept: a
    // file already in the list too, when maxFiles dropped while this read was under way.
    const kept = live.multiple ? filesRef.current : [];
    const same = (a: ReadFile, b: ReadFile) =>
      a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    const added = read.filter((f, i) => !kept.some((k) => same(k, f)) && read.findIndex((g) => same(g, f)) === i);
    const next = [...kept, ...added].slice(0, live.maxFiles);
    [...kept, ...read].filter((f) => !next.includes(f)).forEach((f) => releaseFileHandle(f.handle));
    if (added.length > next.length - kept.length) {
      setRejectError(M.rejectionMessage([{ errors: [{ code: 'too-many-files' }] }], { maxFiles: live.maxFiles }));
    }
    // A file whose content could not be parsed says so, beside the list (it is also on the file, as parseError).
    const unparsed = next.filter((f) => !kept.includes(f) && f.parseError).map((f) => f.parseError);
    if (unparsed.length) setRejectError(unparsed.join(' '));
    if (next.length === kept.length && live.multiple) return undefined;
    // The files, and isValid and a Form's formData derived from them, are published before the events fire (runNow),
    // so a handler (or a Form submitted from one) reads the new selection.
    runNow(() => {
      publish(next);
      fireEvent('onFileSelected');
      // The native File picker's event once the files are read (and parsed, with Parse content on).
      fireEvent('onFileLoaded');
    });
    return undefined;
  };
  const remove = (index: number) => {
    const file = filesRef.current[index];
    if (!file) return;
    releaseFileHandle(file.handle);
    runNow(() => {
      setRejectError('');
      publish(filesRef.current.filter((_, i) => i !== index));
      fireEvent('onFileDeselected');
    });
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
          <input {...getInputProps({ id: fieldIdOf(props) })} />
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
