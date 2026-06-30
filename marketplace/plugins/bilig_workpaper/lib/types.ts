export enum Operation {
  VerifyFormulaReadback = 'verify_formula_readback',
}

export type SourceOptions = {
  baseUrl: string;
  formulaReadbackPath?: string;
};

export type QueryOptions = {
  operation: Operation;
  sheetName?: string;
  address?: string;
  value?: string | number | boolean | null;
};

export type FormulaReadbackPayload = {
  sheetName: string;
  address: string;
  value: unknown;
};
