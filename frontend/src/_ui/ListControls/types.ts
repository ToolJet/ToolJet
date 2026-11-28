export interface ListOption<Value extends string> {
  value: Value;
  label: string;
}

export interface SortGroup<Value extends string> {
  id: string;
  label: string;
  options: ListOption<Value>[];
}
