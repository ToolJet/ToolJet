import type { KeyboardEvent } from 'react';

export type CascaderValue = string | number;

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
  valuePathObj: Record<string | number, CascaderValue[]>;
  labelPathObj: Record<string | number, string[]>;
  leafSet: Set<CascaderValue>;
  valueToNode: Record<string | number, CascaderNode>;
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
