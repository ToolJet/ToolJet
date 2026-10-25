import { ToolJet } from '@tooljet/custom-component-sdk';

// The SDK as the host provides it (frontend/.../LibraryComponent/inlineRuntime.ts), typed for the inputs group: the
// installed SDK typings predate the style hooks and pack contract v2, so the components read it through this.

interface FieldOptions {
  name: string;
  label?: string;
  description?: string;
  section?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  visibleWhen?: { key: string; value: unknown };
}

export interface Validation {
  isValid: boolean;
  error: string;
  required: boolean;
  touch: () => void;
}

type Setter<T> = (v: T | ((prev: T) => T)) => void;

interface Sdk {
  useStateString(o: FieldOptions & { initialValue?: string; inspector?: 'code' | 'color' | 'hidden' }): [string, Setter<string>];
  useStateNumber(o: FieldOptions & { initialValue?: number | string; inspector?: 'code' | 'number' | 'hidden' }): [number, Setter<number>];
  useStateBoolean(o: FieldOptions & { initialValue?: boolean; inspector?: 'toggle' | 'hidden' }): [boolean, Setter<boolean>];
  useStateArray(o: FieldOptions & { initialValue?: unknown[]; inspector?: 'code' | 'options' | 'hidden' }): [unknown[], Setter<unknown[]>];
  useStateObject(o: FieldOptions & { initialValue?: Record<string, unknown>; inspector?: 'code' | 'hidden' }): [Record<string, unknown>, Setter<Record<string, unknown>>];
  useStateEnumeration<T extends string>(
    o: FieldOptions & { enumDefinition: T[]; initialValue?: T; inspector?: 'select' | 'switch' | 'hidden'; enumLabels?: Partial<Record<T, string>> }
  ): [T, Setter<T>];
  useStyleString(o: FieldOptions & { initialValue?: string; inspector?: string; expose?: boolean }): string;
  useStyleNumber(o: FieldOptions & { initialValue?: number | string; inspector?: string; expose?: boolean }): number | string;
  useEventCallback(o: { name: string; displayName?: string }): () => void;
  useAction(
    o: { name: string; displayName?: string; params?: { handle: string; displayName?: string; type?: string; defaultValue?: unknown }[] },
    handler: (...args: unknown[]) => unknown
  ): void;
  useComponentSettings(o: { defaultWidth?: number; defaultHeight?: number }): void;
  useControlState(): { disabled: boolean; loading: boolean };
  useValidation(o: { section?: 'text' | 'choice' | 'date'; value: unknown; present?: boolean }): Validation;
  useFieldId(): string | undefined;
}

export const TJ = ToolJet as unknown as Sdk;
