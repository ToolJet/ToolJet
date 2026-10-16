// shadcn/ui pack (experiment): pure logic of the File upload widget. No React here: every function takes junk
// (null, wrong types, huge numbers) without throwing.

import { asList, clampInt, isText } from './pickersModel';

// ---- Files ---------------------------------------------------------------------------------------------------------

/** A byte count as text: '0 B', '512 B', '1.5 KB', '5 MB'. */
export const formatBytes = (n) => {
  const bytes = Number(n);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${i === 0 ? value : Math.round(value * 10) / 10} ${units[i]}`;
};

const EXT_MIME = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  txt: 'text/plain',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  zip: 'application/zip',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
};

/** The accepted types as a list: from 'image/*, .pdf' or ['image/*', '.pdf']. */
export const acceptList = (accept) =>
  (Array.isArray(accept) ? accept : typeof accept === 'string' ? accept.split(',') : [])
    .filter(isText)
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => /^\.[a-z0-9]+$/.test(t) || /^[a-z]+\/[a-z0-9.+*-]+$/.test(t));

/** react-dropzone's accept map ({ mime: [extensions] }); undefined accepts any file. */
export const toDropzoneAccept = (accept) => {
  const types = acceptList(accept);
  if (!types.length) return undefined;
  const map = {};
  for (const t of types) {
    if (t.startsWith('.')) {
      const mime = EXT_MIME[t.slice(1)] || 'application/octet-stream';
      map[mime] = [...(map[mime] || []), t];
    } else if (!map[t]) map[t] = [];
  }
  return map;
};

const MIME_NAME = {
  'image/*': 'Images',
  'video/*': 'Videos',
  'audio/*': 'Audio',
  'text/*': 'Text files',
  'application/pdf': 'PDF',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
  'application/json': 'JSON',
  'image/svg+xml': 'SVG',
  'image/jpeg': 'JPG',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

/** The accepted types in words: 'Images, PDF, CSV' ('' for any file). */
export const acceptHint = (accept) => {
  const names = acceptList(accept).map(
    (t) => MIME_NAME[t] || (t.startsWith('.') ? t.slice(1).toUpperCase() : t.split('/')[1].toUpperCase())
  );
  return [...new Set(names)].join(', ');
};

/** What kind of file it is, for its icon: image, pdf, sheet, text, archive, audio, video or other. */
export const fileKind = (type, name) => {
  const t = String(type ?? '').toLowerCase();
  const ext = (String(name ?? '').match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (t === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (/sheet|excel|csv|tab-separated/.test(t) || ['csv', 'tsv', 'xls', 'xlsx'].includes(ext)) return 'sheet';
  if (t.startsWith('audio/')) return 'audio';
  if (t.startsWith('video/')) return 'video';
  if (/zip|compressed|tar|rar|7z/.test(t) || ['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return 'archive';
  if (t.startsWith('text/') || /json|xml|word|document/.test(t) || ['txt', 'md', 'json', 'doc', 'docx'].includes(ext))
    return 'text';
  return 'other';
};

/** A file count limit: 1 to 100 (default 10). */
export const clampFiles = (v) => clampInt(v, 1, 100, 10);
/** A size limit in bytes: 0 means none. */
export const clampBytes = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** The error line for files react-dropzone refused (or the count limit), naming the first problem. */
export const rejectionMessage = (rejections, { maxSize = 0, minSize = 0, maxFiles = 0 } = {}) => {
  const first = asList(rejections)[0];
  if (!first) return '';
  const name = first.file?.name ? `"${first.file.name}"` : 'A file';
  const code = asList(first.errors)[0]?.code;
  const more = rejections.length > 1 ? ` (${rejections.length} files not added)` : '';
  switch (code) {
    case 'file-too-large':
      return `${name} is larger than ${formatBytes(maxSize)}${more}`;
    case 'file-too-small':
      return `${name} is smaller than ${formatBytes(minSize)}${more}`;
    case 'file-invalid-type':
      return `${name} is not an accepted file type${more}`;
    case 'too-many-files':
      return `You can upload up to ${maxFiles} file${maxFiles === 1 ? '' : 's'}`;
    default:
      return `${name} could not be added${more}`;
  }
};
