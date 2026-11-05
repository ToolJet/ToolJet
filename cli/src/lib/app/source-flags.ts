import { Flags } from '@oclif/core';

import { ApiError } from './session';
import { behindMessage } from './source-sync';
import { SOURCE_OWNERS, SourceOwner, SourceState, SourceUploadResult, StoredSource } from './source-upload';

/** `--source` on dev and publish: upload the project's source to ToolJet beside the bundle. */
export const sourceFlags = {
  source: Flags.string({
    description:
      'Also store the source on ToolJet: "repository" keeps this repository the owner (the editor shows it read-only), "platform" hands editing to the ToolJet editor',
    options: SOURCE_OWNERS,
  }),
  'source-replace': Flags.boolean({
    description: 'Replace source that was edited in the ToolJet editor (otherwise the upload stops with a conflict)',
    default: false,
  }),
  verbose: Flags.boolean({ description: "Also print the stored code's revision and owner", default: false }),
};

/** The line printed after `--source` saved the code; revision and owner are internal, so only with --verbose. */
export function codeSavedLine(stored: SourceUploadResult, verbose: boolean): string {
  const detail = verbose ? `, revision ${stored.revision}, owner ${stored.owner}` : '';
  return `Code saved in ToolJet (${stored.files.length} files${detail})`;
}

/** `--no-source` on dev: dev stores code the ToolJet editor owns after every build unless told not to. */
export const noSourceFlag = {
  'no-source': Flags.boolean({
    description:
      "Don't store the source on ToolJet after each build (by default dev does when the ToolJet editor owns it)",
    default: false,
  }),
};

/**
 * Who `tooljet app dev` stores the source as after each build, or null for not at all. An explicit --source wins and
 * --no-source turns it off; otherwise code the ToolJet editor owns (as this project last synced it, or as ToolJet
 * stores it) follows every build, so the AI, the Code panel and Save version work from the code that is running.
 */
export function devSourceOwner(
  flags: { source?: string; 'no-source'?: boolean },
  local: SourceState | undefined,
  stored: StoredSource | undefined
): SourceOwner | null {
  if (flags['no-source']) return null;
  if (flags.source) return flags.source as SourceOwner;
  if (local?.owner === 'platform' || (stored?.exists && stored.owner === 'platform')) return 'platform';
  return null;
}

/** A 409 from the source upload: ToolJet holds a newer revision (an editor or AI edit) than the one this build is on. */
export const isSourceConflict = (err: unknown): boolean => err instanceof ApiError && err.status === 409;

/** The version dev started on was locked while it ran (saved or released); dev stays on the one it started with. */
export const isVersionLocked = (err: unknown): boolean =>
  err instanceof ApiError && err.status === 403 && /not a draft/i.test(err.message);

export const VERSION_LOCKED_LINE =
  "This version is locked, so this code wasn't saved. If there's a new draft, restart tooljet app dev to follow it.";

export function sourceConflictLines(err: ApiError): string[] {
  let current: number | undefined;
  try {
    current = JSON.parse(err.body)?.currentRevision;
  } catch {
    // The status is enough.
  }
  return [behindMessage(typeof current === 'number' ? current : undefined)];
}
