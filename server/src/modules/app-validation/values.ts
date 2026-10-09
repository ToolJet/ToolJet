import { parse } from 'acorn';
import { isPlainObject } from 'lodash';
import { MAX_EXPRESSION_LENGTH } from './constants';

// Copies of the frontend resolver (frontend/src/AppBuilder/_stores/utils.js). Keep in sync so the
// server reads `{{ }}` exactly like the app does.

export function getDynamicVariables(text: string): string[] | null {
  return text.match(/\{\{(.*?)\}\}/gs) || text.match(/%%(.*?)%%/gs);
}

function queryHasStringOtherThanVariable(query: string): boolean {
  if (query.startsWith('{{') && query.endsWith('}}')) {
    const content = query.slice(2, -2).trim();
    if (content.includes(' ')) return true;
    return /\$\{[^}]+\}/.test(content);
  }
  return false;
}

export function removeNestedDoubleCurlyBraces(str: string): string {
  const transformedInput = str.split('');
  let iter = 0;
  const stack: number[] = [];

  while (iter < str.length - 1) {
    if (transformedInput[iter] === '{' && transformedInput[iter + 1] === '{') {
      transformedInput[iter] = 'le';
      transformedInput[iter + 1] = 'le';
      stack.push(2);
      iter += 2;
    } else if (transformedInput[iter] === '{') {
      stack.push(1);
      iter++;
    } else if (transformedInput[iter] === '}' && stack.length > 0 && stack[stack.length - 1] === 1) {
      stack.pop();
      iter++;
    } else if (
      transformedInput[iter] === '}' &&
      stack.length > 0 &&
      transformedInput[iter + 1] === '}' &&
      stack[stack.length - 1] === 2
    ) {
      stack.pop();
      transformedInput[iter] = 'ri';
      transformedInput[iter + 1] = 'ri';
      iter += 2;
    } else {
      iter++;
    }
  }

  iter = 0;
  let shouldRemoveSpace = true;
  while (iter < str.length) {
    if (shouldRemoveSpace && [' ', '\n', '\t'].includes(transformedInput[iter])) {
      transformedInput[iter] = '';
    } else if (transformedInput[iter] === 'le') {
      shouldRemoveSpace = true;
      transformedInput[iter] = '';
    } else {
      shouldRemoveSpace = false;
    }
    iter++;
  }

  iter = str.length - 1;
  shouldRemoveSpace = true;
  while (iter >= 0) {
    if (shouldRemoveSpace && [' ', '\n', '\t'].includes(transformedInput[iter])) {
      transformedInput[iter] = '';
    } else if (transformedInput[iter] === 'ri') {
      shouldRemoveSpace = true;
      transformedInput[iter] = '';
    } else {
      shouldRemoveSpace = false;
    }
    iter--;
  }

  return transformedInput.join('');
}

export function hasBraces(value: unknown): value is string {
  return typeof value === 'string' && value.includes('{{');
}

// The code pieces the runtime compiles, following the branches of `resolveDynamicValues`.
export function compiledCodeUnits(value: string): string[] {
  const segments = getDynamicVariables(value) || [];
  const hasJsCode = queryHasStringOtherThanVariable(value);
  let useJsResolvers = hasJsCode || segments.length > 1;

  if (
    !hasJsCode &&
    segments.length === 1 &&
    (!value.startsWith('{{') || !value.endsWith('}}')) &&
    value.includes('{{')
  ) {
    useJsResolvers = true;
  }

  if (useJsResolvers) {
    const isJsCodeResolver = hasJsCode && (segments.length === 1 || segments.length === 0);
    if (!isJsCodeResolver) return segments.map(removeNestedDoubleCurlyBraces);
  }
  return [removeNestedDoubleCurlyBraces(value)];
}

export interface BrokenBraces {
  unclosed: boolean;
  syntaxError?: { code: string; message: string };
}

// Undefined when the value is fine. Code is parsed, never executed.
export function findBrokenBraces(value: unknown): BrokenBraces | undefined {
  if (!hasBraces(value)) return undefined;

  const withoutSegments = value.replace(/\{\{(.*?)\}\}/gs, '');
  const unclosed = withoutSegments.includes('{{');

  let syntaxError: BrokenBraces['syntaxError'];
  if (!unclosed) {
    for (const code of compiledCodeUnits(value)) {
      if (code.length > MAX_EXPRESSION_LENGTH) continue;
      try {
        // The runtime compiles `return <code>` with `Function(...)`.
        parse(`return ${code}`, { ecmaVersion: 'latest', allowReturnOutsideFunction: true });
      } catch (error) {
        syntaxError = { code, message: (error as Error).message };
        break;
      }
    }
  }

  return unclosed || syntaxError ? { unclosed, syntaxError } : undefined;
}

// `structure-mismatch` (object/list where a single value belongs) is safe to block.
// `scalar-mismatch` (e.g. "ten" for a number) should stay heuristic: ToolJet itself stores numbers as text.
export type ValueFit = 'ok' | 'structure-mismatch' | 'scalar-mismatch';

export interface ValueSchema {
  type?: string;
  schemas?: ValueSchema[];
}

const isScalar = (v: unknown) => v === null || ['string', 'number', 'boolean'].includes(typeof v);
const isNumericText = (v: string) => v.trim() !== '' && Number.isFinite(Number(v));

export function plainValueFit(value: unknown, schema: ValueSchema | undefined): ValueFit {
  if (!schema?.type || value === undefined || value === null || value === '' || hasBraces(value)) return 'ok';

  switch (schema.type) {
    case 'string':
      return isScalar(value) ? 'ok' : 'structure-mismatch';
    case 'number':
      if (typeof value === 'number') return 'ok';
      if (!isScalar(value)) return 'structure-mismatch';
      return typeof value === 'string' && isNumericText(value) ? 'ok' : 'scalar-mismatch';
    case 'boolean':
      if (typeof value === 'boolean') return 'ok';
      if (!isScalar(value)) return 'structure-mismatch';
      return value === 'true' || value === 'false' ? 'ok' : 'scalar-mismatch';
    case 'array':
      if (Array.isArray(value)) return 'ok';
      return isPlainObject(value) ? 'structure-mismatch' : 'scalar-mismatch';
    case 'object':
      if (isPlainObject(value)) return 'ok';
      return Array.isArray(value) ? 'structure-mismatch' : 'scalar-mismatch';
    case 'union': {
      const fits = (schema.schemas ?? []).map((s) => plainValueFit(value, s));
      if (!fits.length || fits.includes('ok')) return 'ok';
      return fits.includes('scalar-mismatch') ? 'scalar-mismatch' : 'structure-mismatch';
    }
    default:
      return 'ok';
  }
}
