export type DraftConstraints = {
  is_not_null: boolean;
  is_unique: boolean;
  is_primary_key: boolean;
};

/** A column being edited in a drawer. `id` is stable across renames and reorders; it never reaches the server. */
export type DraftColumn = {
  id: string;
  column_name: string;
  /** A Postgres type name as TJDB uses it (`character varying`, `serial`, ...); null until chosen. */
  data_type: string | null;
  column_default: string | null;
  constraints_type: DraftConstraints;
  configurations: Record<string, unknown>;
  /** Set on a column the table already has (Edit table); its type cannot be changed here. */
  existing?: boolean;
};

export type ColumnPayload = Omit<DraftColumn, 'id' | 'column_default' | 'existing'> & { column_default?: string };

export type RelationAction = 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT' | 'NO ACTION';

/** A foreign key being edited. Same fields the server takes, plus a draft `id`. */
export type DraftRelation = {
  id: string;
  column_names: string[];
  referenced_table_name: string;
  referenced_table_id?: string;
  referenced_column_names: string[];
  on_delete: RelationAction | string;
  on_update: RelationAction | string;
  /** Set on a relation the table already has; needed to change or remove it. */
  constraint_name?: string;
};

export type RelationPayload = Omit<DraftRelation, 'id' | 'constraint_name'>;
