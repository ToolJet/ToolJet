import { registerFileHandle } from '@/AppBuilder/_utils/fileHandleRegistry';
import { parseContent } from './fileParse';

const stopped = () => new DOMException('The file is no longer wanted', 'AbortError');

/** One FileReader read; when `signal` aborts, the read is aborted and the promise rejects with an AbortError. */
export const readAs = (file: Blob, how: 'readAsDataURL' | 'readAsText', signal?: AbortSignal) =>
  new Promise<string>((resolve, reject) => {
    if (signal?.aborted) return reject(stopped());
    const reader = new FileReader();
    const onAbort = () => {
      reader.abort();
      reject(stopped());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    const settled = () => signal?.removeEventListener('abort', onAbort);
    reader.onload = () => {
      settled();
      resolve(String(reader.result ?? ''));
    };
    reader.onerror = () => {
      settled();
      reject(reader.error || new Error('Failed to read file'));
    };
    reader[how](file);
    return undefined;
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
  /** Why the content could not be parsed ('' when it was, or parsing is off). */
  parseError: string;
}

/** Reads a file the native File picker's way: text content, base64 and data URL, held in the file-handle registry
 *  (the store gets light string-like refs), plus parsed rows for CSV/TSV/Excel/JSON when parsing is on. Once `signal`
 *  aborts, no further read, parse or registration starts (one already running is aborted, a parse runs to its end). */
export const readFile = async (
  file: File,
  {
    parse,
    parseFileType,
    delimiter,
    signal,
  }: { parse: boolean; parseFileType?: unknown; delimiter?: unknown; signal?: AbortSignal }
): Promise<ReadFile> => {
  const wanted = () => {
    if (signal?.aborted) throw stopped();
  };
  const dataURL = await readAs(file, 'readAsDataURL', signal);
  const content = await readAs(file, 'readAsText', signal);
  const base64Data = dataURL.split(',')[1] || '';
  wanted();
  const parsed = parse ? await parseContent(file, content, base64Data, { parseFileType, delimiter }) : null;
  wanted();
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
    parsedData: parsed ? parsed.data : null,
    parseError: parsed ? parsed.error : '',
  };
};
