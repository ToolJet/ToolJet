import type { KeyboardEvent } from 'react';

export type CascaderValue = unknown;

export type CascaderOptionControlValue = { value?: unknown } | unknown;

export interface CascaderOption {
  label?: unknown;
  value?: CascaderValue;
  visible?: CascaderOptionControlValue;
  disable?: CascaderOptionControlValue;
  default?: CascaderOptionControlValue;
  children?: CascaderOption[];
}

export interface CascaderNode {
  label: string;
  value: CascaderValue;
  disabled: boolean;
  children?: CascaderNode[];
}

export interface CascaderPathMaps {
  valuePathObj: Record<string, CascaderValue[]>;
  labelPathObj: Record<string, string[]>;
  leafSet: Set<string>;
  valueToNode: Record<string, CascaderNode>;
}

export interface CascaderSelection {
  value: CascaderValue | null;
  selectedOption: { label: string | undefined; value: CascaderValue | undefined } | null;
  pathArray: CascaderValue[];
  pathLabels: string[];
  pathString: string;
}

export interface CascaderValidationStatus {
  isValid: boolean;
  validationError: string | null;
}

export interface CascaderMenuRef {
  handleKeyDown: (e: KeyboardEvent) => boolean;
}
