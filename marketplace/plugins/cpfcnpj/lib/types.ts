export type SourceOptions = {
  token: string;
};

export enum Operation {
  CpfBasic = 'cpf_basic',
  CpfFull = 'cpf_full',
  CnpjBasic = 'cnpj_basic',
  CnpjFull = 'cnpj_full',
  Balance = 'balance',
}

export type QueryOptions = {
  operation: Operation;
  document?: string;
  package?: string;
};
