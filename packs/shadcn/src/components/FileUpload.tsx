import React, { useEffect, useRef, useState } from 'react';
import { File as FileIcon, FileArchive, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, Loader2, Upload, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Field } from '../lib/Field';
import { cn } from '../lib/cn';
import { TJ } from '../lib/ui2/inputs/sdk';
import { useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { TOKEN } from '../lib/styleDefaults';
import { useRuleCheck } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import type { FileKind } from '../lib/ui2/inputs/model';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ['labelColor', 'Label color', '--lk-label', TOKEN.text],
  ['helpTextColor', 'Help text color', '--lk-help', TOKEN.mutedText],
  ['dropzoneBackgroundColor', 'Dropzone background', '--lk-drop-bg', 'transparent'],
  ['dropzoneBorderColor', 'Dropzone border color', '--lk-drop-border', TOKEN.border],
  ['iconColor', 'Upload icon color', '--lk-icon', TOKEN.mutedText],
  ['iconBackgroundColor', 'Upload icon background', '--lk-icon-bg', TOKEN.muted],
  ['titleColor', 'Title color', '--lk-title', TOKEN.text],
  ['hintColor', 'Hint color', '--lk-hint', TOKEN.mutedText],
  ['accentColor', 'Accent (drag over, browse link)', 'accent', TOKEN.brand],
  ['fileItemBackgroundColor', 'File row background', '--lk-item-bg', TOKEN.surface],
  ['fileItemBorderColor', 'File row border color', '--lk-item-border', TOKEN.border],
  ['errorColor', 'Error color', '--lk-error', TOKEN.error],
  ['borderRadius', 'Radius', '--lk-radius', 'px'],
];

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

/** A file as the native File picker exposes it. */
interface ReadFile {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  content: string;
  base64Data: string;
  dataURL: string;
  parsedData: unknown;
  parseError: string;
}

// Every reader in flight is kept in `track`, so a newer single-file choice, a clear or an unmount can abort it.
const readAs = (file: Blob, how: 'readAsDataURL' | 'readAsText', track: Set<FileReader>) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    track.add(reader);
    reader.onload = () => {
      track.delete(reader);
      resolve(String(reader.result ?? ''));
    };
    reader.onerror = () => {
      track.delete(reader);
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.onabort = () => {
      track.delete(reader);
      reject(new Error('File read cancelled'));
    };
    reader[how](file);
  });

/**
 * CSV, TSV or JSON content as data. Excel needs a sheet reader the pack does not bundle, so Excel is not offered as a
 * parse type; a file that is still parsed as one (auto-detect, or an older app's saved setting) says so in parseError.
 */
const parseContent = (file: File, text: string, parseFileType: string, delimiter: string): { data: unknown; error: string } => {
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  const kind =
    parseFileType && parseFileType !== 'auto-detect'
      ? parseFileType
      : ext === 'json' || type.includes('json')
        ? 'json'
        : ext === 'tsv' || type.includes('tab-separated')
          ? 'tsv'
          : ext === 'xls'
            ? 'vnd.ms-excel'
            : ext === 'xlsx'
              ? 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : ext === 'csv' || type.includes('csv')
                ? 'csv'
                : '';
  try {
    if (kind === 'json') return { data: JSON.parse(text), error: '' };
    if (kind === 'csv' || kind === 'tsv') {
      const warnings: string[] = [];
      const data = M.parseDelimited(text, kind === 'tsv' ? '\t' : delimiter || ',', warnings);
      return { data, error: warnings.length ? `"${file.name}": ${warnings.join('; ')}` : '' };
    }
    if (kind.includes('excel') || kind.includes('spreadsheet')) return { data: null, error: `"${file.name}": Excel files cannot be parsed here` };
    return { data: null, error: `"${file.name}" is not a CSV, TSV or JSON file` };
  } catch {
    return { data: null, error: `"${file.name}" could not be parsed` };
  }
};

export const FileUpload = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Attachments' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [title] = TJ.useStateString({ name: 'title', label: 'Title', initialValue: 'Drag & drop files here' });
  const [hint] = TJ.useStateString({ name: 'hint', label: 'Hint (empty: accepted types and size)', initialValue: '' });
  const [accept] = TJ.useStateString({ name: 'accept', label: 'Accept file types', placeholder: 'image/*,application/pdf,.csv', initialValue: 'image/*,application/pdf' });
  const [multipleProp] = TJ.useStateBoolean({ name: 'multiple', label: 'Allow multiple files', initialValue: true });
  const [maxFilesProp] = TJ.useStateNumber({ name: 'maxFiles', label: 'Max files', initialValue: 5 });
  const [maxSizeProp] = TJ.useStateNumber({ name: 'maxSize', label: 'Max size (bytes, 0 for no limit)', initialValue: 5242880 });
  const [minSizeProp] = TJ.useStateNumber({ name: 'minSize', label: 'Min size (bytes)', initialValue: 0 });
  const [showPreview] = TJ.useStateBoolean({ name: 'showPreview', label: 'Show image thumbnails', initialValue: true });
  const [parse] = TJ.useStateBoolean({ name: 'parseContent', label: 'Parse content (CSV, TSV, JSON)', initialValue: false });
  const [parseFileType] = TJ.useStateEnumeration({
    name: 'parseFileType',
    label: 'Parse as',
    // No Excel entries: the pack has no sheet reader, so offering them promised parsing it cannot do.
    enumDefinition: ['auto-detect', 'csv', 'tsv', 'json'],
    enumLabels: {
      'auto-detect': 'Autodetect from type',
      csv: 'CSV',
      tsv: 'TSV',
      json: 'JSON',
    },
    initialValue: 'auto-detect',
  });
  const [delimiter] = TJ.useStateString({ name: 'delimiter', label: 'CSV delimiter', initialValue: ',' });
  // Exposed: the files (the native File picker's `file`), their total size and whether parsing is under way.
  const [, setFile] = TJ.useStateArray({ name: 'file', initialValue: [], inspector: 'hidden' });
  const [, setFileSize] = TJ.useStateNumber({ name: 'fileSize', initialValue: 0, inspector: 'hidden' });
  const [, setIsParsing] = TJ.useStateBoolean({ name: 'isParsing', initialValue: false, inspector: 'hidden' });
  const [legacyRequired] = TJ.useStateBoolean({ name: 'required', label: 'Required', initialValue: false, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onFileSelected = TJ.useEventCallback({ name: 'onFileSelected' });
  const onFileDeselected = TJ.useEventCallback({ name: 'onFileDeselected' });
  const onFileLoaded = TJ.useEventCallback({ name: 'onFileLoaded' });

  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ReadFile[]>([]);
  const filesRef = useRef(files);
  // `generation` changes on a clear, a newer single-file choice and unmount: a read started before it is no longer
  // owned and publishes nothing. `pending` counts the live generation's files still being read (they hold their place
  // under maxFiles) and those being parsed (isParsing stays true until the last one settles).
  const generation = useRef(0);
  const readers = useRef(new Set<FileReader>());
  const pending = useRef({ files: 0, parsing: 0 });
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [rejectError, setRejectError] = useState('');
  const multiple = multipleProp !== false;
  const maxFiles = multiple ? M.clampFiles(maxFilesProp) : 1;
  const maxSize = M.clampBytes(maxSizeProp);
  const minSize = M.clampBytes(minSizeProp);
  // What a read checks when it finishes, so a limit lowered while it was pending still applies.
  const limits = useRef({ multiple, maxFiles });
  limits.current = { multiple, maxFiles };

  // A Form's clearForm empties what the field shows as well as what it exposes (the SDK clears only `value`).
  TJ.useFormClear(() => clearFiles(false));
  const publish = (next: ReadFile[]) => {
    filesRef.current = next;
    setFiles(next);
    setFile(next);
    setFileSize(next.reduce((sum, f) => sum + (f.size || 0), 0));
  };
  // Disowns and aborts every read in flight. It writes no state, so unmount can use it too.
  const stopReads = () => {
    generation.current += 1;
    pending.current = { files: 0, parsing: 0 };
    const inFlight = Array.from(readers.current);
    readers.current.clear();
    inFlight.forEach((r) => r.abort());
  };
  // A row removed from a ListView (or any unmount) must not publish a file or fire onFileLoaded after it has gone.
  useEffect(() => stopReads, []);
  const clearFiles = (withEvent = true) => {
    stopReads();
    const had = filesRef.current.length > 0;
    setRejectError('');
    setParsing(false);
    setIsParsing(false);
    publish([]);
    if (withEvent && had) onFileDeselected();
  };
  // setFileName(index, name) or setFileName([{ index, newFileName }]): renames files and keeps each one's extension.
  const rename = (indexOrUpdates: unknown, single?: unknown) => {
    const updates = Array.isArray(indexOrUpdates)
      ? (indexOrUpdates.slice(0, 1000).filter((u) => u && typeof u === 'object') as Record<string, unknown>[])
      : [{ index: Number(indexOrUpdates), newFileName: single }];
    const names = new Map<number, string>();
    for (const u of updates) {
      const name = typeof u.newFileName === 'string' ? u.newFileName.trim() : '';
      const index = Number(u.index);
      if (Number.isInteger(index) && name) names.set(index, name);
    }
    if (!names.size) return;
    publish(
      filesRef.current.map((f, i) => {
        const newName = names.get(i);
        if (newName === undefined) return f;
        const dot = f.name.lastIndexOf('.');
        return { ...f, name: dot > 0 ? `${newName}${f.name.slice(dot)}` : newName };
      })
    );
  };
  TJ.useAction({ name: 'clearFiles', displayName: 'Clear files' }, () => clearFiles());
  TJ.useAction(
    {
      name: 'setFileName',
      displayName: 'Set file name',
      params: [
        { handle: 'indexOrUpdates', displayName: 'Index or updates' },
        { handle: 'newNameIfSingle', displayName: 'New name' },
      ],
    },
    (indexOrUpdates, name) => rename(indexOrUpdates, name)
  );

  const control = TJ.useControlState();
  const check = TJ.useValidation({ section: 'choice', value: files.length || '', present: files.length > 0 });
  const rule = useRuleCheck(check, legacyRequired && !files.length ? 'This field is mandatory' : '');
  const looks = useLooks(LOOKS);
  TJ.useComponentSettings({ defaultWidth: 12, defaultHeight: 18 });

  const disabled = legacyDisabled || control.disabled;
  const full = multiple && files.length >= maxFiles;
  const off = disabled || full;

  const add = async (list: FileList | null) => {
    rule.touch();
    const picked = Array.from(list ?? []);
    if (!picked.length) return;
    const current = multiple ? filesRef.current : [];
    const problems: string[] = [];
    const fits = picked.filter((f) => {
      if (!M.accepts(f, accept)) problems.push(`"${f.name}" is not an accepted file type`);
      else if (maxSize && f.size > maxSize) problems.push(`"${f.name}" is larger than ${M.formatBytes(maxSize)}`);
      else if (minSize && f.size < minSize) problems.push(`"${f.name}" is smaller than ${M.formatBytes(minSize)}`);
      else return true;
      return false;
    });
    const fresh = fits.filter((f) => !current.some((c) => c.name === f.name && c.size === f.size && c.lastModified === f.lastModified));
    // Files still being read hold their place, so a second pick while the first is pending cannot overfill maxFiles.
    const room = multiple ? Math.max(0, maxFiles - current.length - pending.current.files) : 1;
    const taking = fresh.slice(0, room);
    const limitMessage = (max: number) => `You can upload up to ${max} file${max === 1 ? '' : 's'}`;
    let message = problems.length ? `${problems[0]}${problems.length > 1 ? ` (${problems.length} files not added)` : ''}` : '';
    if (!message && fresh.length > taking.length) message = limitMessage(maxFiles);
    setRejectError(message);
    if (!taking.length) return;
    // A newer single-file choice replaces the one still being read, whichever read would finish first.
    if (!multiple) stopReads();
    const started = generation.current;
    pending.current.files += taking.length;
    if (parse) {
      pending.current.parsing += taking.length;
      setParsing(true);
      setIsParsing(true);
    }
    const results = await Promise.allSettled(
      taking.map(async (f): Promise<ReadFile> => {
        const dataURL = await readAs(f, 'readAsDataURL', readers.current);
        const content = await readAs(f, 'readAsText', readers.current);
        const parsed = parse ? parseContent(f, content, parseFileType, delimiter) : null;
        return {
          name: f.name,
          type: f.type,
          size: f.size,
          lastModified: f.lastModified,
          content,
          base64Data: dataURL.split(',')[1] || '',
          dataURL,
          parsedData: parsed ? parsed.data : null,
          parseError: parsed ? parsed.error : '',
        };
      })
    );
    // A clear, a newer single-file choice or unmount while the files were read wins: they are not added.
    if (started !== generation.current) return;
    pending.current.files -= taking.length;
    if (parse) {
      pending.current.parsing -= taking.length;
      if (pending.current.parsing <= 0) {
        setParsing(false);
        setIsParsing(false);
      }
    }
    const read = results.filter((r): r is PromiseFulfilledResult<ReadFile> => r.status === 'fulfilled').map((r) => r.value);
    const notes: string[] = [];
    if (read.length < taking.length) notes.push(`${taking.length - read.length} file(s) could not be read`);
    notes.push(...read.filter((f) => f.parseError).map((f) => f.parseError));
    const live = limits.current;
    const base = live.multiple ? filesRef.current : [];
    const next = [...base, ...read].slice(0, live.maxFiles);
    const admitted = read.filter((f) => next.includes(f)).length;
    if (admitted < read.length) notes.push(limitMessage(live.maxFiles));
    if (notes.length) setRejectError(notes.join(' '));
    // Events fire only for files that entered the list.
    if (!admitted) return;
    publish(next);
    onFileSelected();
    onFileLoaded();
  };
  const remove = (index: number) => {
    if (!filesRef.current[index]) return;
    setRejectError('');
    publish(filesRef.current.filter((_, i) => i !== index));
    onFileDeselected();
  };

  const hintText =
    String(hint ?? '').trim() ||
    [M.acceptHint(accept) || 'Any file', maxSize ? `up to ${M.formatBytes(maxSize)}` : '', multiple ? `max ${maxFiles} files` : '']
      .filter(Boolean)
      .join(' · ');
  const titleText = full ? `Limit of ${maxFiles} file${maxFiles === 1 ? '' : 's'} reached` : dragOver ? 'Drop to upload' : title;
  const error = rejectError || rule.error;

  return (
    <div className="ui ui2-in" style={looks}>
      <Field label={label} description={description} error={error} required={rule.required}>
        <div
          role="button"
          tabIndex={off ? -1 : 0}
          aria-label={titleText}
          aria-disabled={off || undefined}
          aria-invalid={error ? true : undefined}
          data-tj-no-drag=""
          className={cn('ui2-drop', dragOver && 'is-over', off && 'is-off')}
          onClick={() => !off && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!off && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!off) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            if (!off) add(e.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            hidden
            accept={M.acceptList(accept).join(',') || undefined}
            multiple={multiple}
            onChange={(e) => {
              add(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="ui2-drop-icon">
            {control.loading || parsing ? <Loader2 size={20} className="ui2-spin" /> : <Upload size={20} />}
          </div>
          <p className="ui2-drop-title">{titleText}</p>
          {full ? null : (
            <p className="ui2-drop-browse">
              or <span>click to browse</span>
            </p>
          )}
          <p className="ui2-drop-hint">{hintText}</p>
        </div>
        {/* Clear all, once two or more files are chosen: what the clearFiles action does. */}
        {files.length >= 2 && !disabled ? (
          <div className="ui2-files-head">
            <span>{`${files.length} files`}</span>
            <button type="button" className="ui2-files-clear" onClick={() => clearFiles()}>
              Clear all
            </button>
          </div>
        ) : null}
        {files.length ? (
          <ul className="ui2-files" aria-label="Selected files">
            {files.map((f, i) => {
              const Kind = KIND_ICONS[M.fileKind(f.type, f.name)] || FileIcon;
              const ext = (f.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toUpperCase();
              return (
                <li key={`${f.name}-${f.lastModified}-${i}`} className="ui2-file">
                  {showPreview !== false && f.type.startsWith('image/') ? (
                    <img src={f.dataURL} alt="" className="ui2-file-thumb" />
                  ) : (
                    <span className="ui2-file-thumb">
                      <Kind size={20} />
                    </span>
                  )}
                  <div className="ui2-file-body">
                    <p className="ui2-file-name">{f.name}</p>
                    <p className="ui2-file-meta">
                      {M.formatBytes(f.size)}
                      {ext ? ` · ${ext}` : ''}
                    </p>
                  </div>
                  <button type="button" className="ui2-file-x" aria-label={`Remove ${f.name}`} disabled={disabled} onClick={() => remove(i)}>
                    <X size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Field>
    </div>
  );
};
