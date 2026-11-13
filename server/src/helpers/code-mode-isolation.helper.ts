/*
  CODE_MODE_ISOLATION, read once and the same way everywhere (the public config the frontend reads, and the frame route).

  - `on` (the default): every code app runs in an isolated frame, in the released view, Preview, the editor canvas and
    version comparisons.
  - `viewer`: only the released view and Preview. The editor and comparisons, where admins and builders open other
    people's code, stay on the ToolJet origin. For a self-hosted pilot only.
  - `off`: no isolation. For a self-hosted rollback only.

  Anything else fails closed: it means `on`, with a warning. A cloud deployment always runs `on` and strict bindings,
  whatever the variables say, and logs an error when they say otherwise: there, one builder's app code would otherwise
  run with the session of everyone who opens it.
*/

export type CodeModeIsolation = 'off' | 'viewer' | 'on';

export interface ResolvedCodeModeIsolation {
  mode: CodeModeIsolation;
  strictBindings: boolean;
  /** What the operator should hear about at startup. */
  messages: { level: 'warn' | 'error'; text: string }[];
}

const MODES: CodeModeIsolation[] = ['off', 'viewer', 'on'];

export function resolveCodeModeIsolation(env: NodeJS.ProcessEnv = process.env): ResolvedCodeModeIsolation {
  const raw = (env.CODE_MODE_ISOLATION ?? '').trim().toLowerCase();
  const cloud = (env.TOOLJET_EDITION ?? '').trim().toLowerCase() === 'cloud';
  const messages: ResolvedCodeModeIsolation['messages'] = [];

  let mode: CodeModeIsolation;
  if (raw === '') {
    mode = 'on';
  } else if ((MODES as string[]).includes(raw)) {
    mode = raw as CodeModeIsolation;
  } else {
    mode = 'on';
    messages.push({
      level: 'warn',
      text: `CODE_MODE_ISOLATION="${raw.slice(0, 40)}" is not off, viewer or on. Code apps run isolated (on).`,
    });
  }

  if (cloud && mode !== 'on') {
    messages.push({
      level: 'error',
      text: `CODE_MODE_ISOLATION=${mode} is not allowed on cloud. Code apps run isolated (on) in the editor, Preview, comparisons and released apps.`,
    });
    mode = 'on';
  } else if (mode === 'viewer') {
    messages.push({
      level: 'warn',
      text: 'CODE_MODE_ISOLATION=viewer: the editor canvas and version comparisons run code apps on the ToolJet origin. Use on wherever builders do not all trust each other.',
    });
  } else if (mode === 'off') {
    messages.push({
      level: 'warn',
      text: 'CODE_MODE_ISOLATION=off: code apps run on the ToolJet origin, with the session of whoever opens them. Use it only where every app builder is trusted.',
    });
  }

  const strictOff = (env.CODE_MODE_STRICT_BINDINGS ?? '').trim().toLowerCase() === 'false';
  if (cloud && strictOff) {
    messages.push({
      level: 'error',
      text: 'CODE_MODE_STRICT_BINDINGS=false is not allowed on cloud. Strict bindings stay on for isolated code apps.',
    });
  }

  return { mode, strictBindings: cloud || !strictOff, messages };
}
