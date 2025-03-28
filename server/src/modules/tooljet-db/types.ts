import { QueryFailedError } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';

export const TJDB = {
  character_varying: 'character varying' as const,
  integer: 'integer' as const,
  bigint: 'bigint' as const,
  serial: 'serial' as const,
  double_precision: 'double precision' as const,
  boolean: 'boolean' as const,
  timestampz: 'timestamp with time zone' as const,
  jsonb: 'jsonb' as const,
};

export type TooljetDatabaseDataTypes = (typeof TJDB)[keyof typeof TJDB];

export type TooljetDatabaseColumn = {
  column_name: string;
  data_type: TooljetDatabaseDataTypes;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  constraints_type: {
    is_not_null: boolean;
    is_primary_key: boolean;
    is_unique: boolean;
  };
  keytype: string | null;
};

export type TooljetDatabaseForeignKey = {
  column_names: string[];
  referenced_table_name: string;
  referenced_column_names: string[];
  on_update: string;
  on_delete: string;
  constraint_name: string;
  referenced_table_id: string;
};

export type TooljetDatabaseTable = {
  id: string;
  table_name: string;
  schema: {
    columns: TooljetDatabaseColumn[];
    foreign_keys: TooljetDatabaseForeignKey[];
  };
};

enum PostgresErrorCode {
  UniqueViolation = '23505',
  CheckViolation = '23514',
  NotNullViolation = '23502',
  ForeignKeyViolation = '23503',
  DuplicateColumn = '42701',
  UndefinedTable = '42P01',
  PermissionDenied = '42501',
  UndefinedFunction = '42883',
}

export type TooljetDbActions =
  | 'add_column'
  | 'create_foreign_key'
  | 'create_table'
  | 'delete_foreign_key'
  | 'drop_column'
  | 'drop_table'
  | 'edit_column'
  | 'edit_table'
  | 'join_tables'
  | 'update_foreign_key'
  | 'view_table'
  | 'view_tables'
  | 'sql_execution'
  | 'bulk_upload'
  | 'proxy_postgrest';

type ErrorCodeMappingItem = Partial<Record<TooljetDbActions | 'default', string>>;
type ErrorCodeMapping = {
  [key in PostgresErrorCode]: ErrorCodeMappingItem;
};

const errorCodeMapping: Partial<ErrorCodeMapping> = {
  [PostgresErrorCode.NotNullViolation]: {
    edit_column: 'Cannot add NOT NULL constraint as this column contains null values',
    proxy_postgrest: 'Not null constraint violated for {{table}}.{{column}}',
  },
  [PostgresErrorCode.UniqueViolation]: {
    edit_column: 'Cannot add UNIQUE constraint as this column contains duplicate values',
    proxy_postgrest: 'Unique constraint violated as {{value}} already exists in {{table}}.{{column}}',
    bulk_upload: 'Duplicate value violates unique constraint',
  },
  [PostgresErrorCode.UndefinedTable]: {
    default: 'Could not find the table {{table}}.',
    sql_execution: `Could not find the table or schema`,
  },
  [PostgresErrorCode.ForeignKeyViolation]: {
    proxy_postgrest: 'Update or delete on  {{table}}.{{column}} with {{value}} violates foreign key constraint',
    sql_execution: 'Update or delete on  {{table}}.{{column}} with {{value}} violates foreign key constraint',
    bulk_upload: 'Insert or update violates foreign key constraint',
  },
  [PostgresErrorCode.PermissionDenied]: {
    default: 'Insufficient privilege',
  },
  [PostgresErrorCode.UndefinedFunction]: {
    // proxy_postgrest: '{{fxName}} - aggregate function requires serial, integer, float or big int column type',
    // join_tables: '{{fxName}} - aggregate function requires serial, integer, float or big int column type',
  },
};

export class PostgrestError extends Error {
  code: string;
  details: string;
  hint: string;
  message: string;

  constructor(postgrestErrorResponse: { code: string; details: string; hint: string; message: string }) {
    super();

    const { code, details, hint, message } = postgrestErrorResponse;
    this.code = code;
    this.details = details;
    this.hint = hint;
    this.message = message;
  }

  toString(): string {
    return `PostgrestError [${this.code}]: ${this.message}`;
  }
}

export class TooljetDatabaseError extends QueryFailedError {
  public readonly code: string;
  public readonly context: {
    origin: TooljetDbActions;
    internalTables: (InternalTable | { id: string; tableName: string })[];
  };
  public readonly queryError: QueryFailedError;

  constructor(
    message: string,
    context: { origin: TooljetDbActions; internalTables: InternalTable[] | { id: string; tableName: string }[] },
    errorObj: QueryFailedError
  ) {
    super(message, errorObj.parameters, errorObj.driverError);
    this.context = context;
    this.code = errorObj.driverError['code'];
    this.queryError = errorObj;
  }

  toString(): string {
    const capitalizeSentence = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    const errorMessage =
      errorCodeMapping[this.code]?.[this.context.origin] ||
      errorCodeMapping[this.code]?.['default'] ||
      capitalizeSentence(this.message);
    return this.replaceErrorPlaceholders(errorMessage);
  }

  replaceErrorPlaceholders(errorMessage: string): string {
    let modifiedErrorMessage = errorMessage;
    const internalTableEntries = this.context.internalTables.map(({ id, tableName }) => [id, tableName]);

    // Templates strings replacement current works in expectation that
    // there will only be one table involved
    const replaceTemplateStrings = (errorMessage: string, replacements: Record<string, string>): string => {
      return Object.entries(replacements).reduce((message, [key, value]) => {
        return message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }, errorMessage);
    };

    const replaceTableUUIDs = (errorMessage: string, internalTableEntries: string[][]): string => {
      return internalTableEntries.reduce((acc, [key, value]) => {
        return acc.replace(new RegExp(key, 'g'), value);
      }, errorMessage);
    };

    const maskWorkspaceSchemaNameInErrorMessage = (errorMessage): string => {
      let output = errorMessage
        .replace(/workspace_[\w-]+\./g, '')
        .replace(/'workspace_[\w-]+'\./g, "'")
        .replace(/workspace_[\w-]+'?/g, '')
        .replace(/\s*workspace_[\w-]+\s*/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/"\s*"/g, '')
        .trim();

      output = output.trim();
      return output;
    };

    // Handle custom errors that are thrown from PostgREST with
    // specific parsers for the error code
    if (this.queryError.driverError instanceof PostgrestError) {
      const parsedTableInfo = this.postgrestDetailsParser();
      if (parsedTableInfo) {
        modifiedErrorMessage = replaceTemplateStrings(modifiedErrorMessage, parsedTableInfo);
      }
    }

    // TODO: Need to handle errors wherein multiple tables are involved when need arises
    //
    // Based on the internalTables in context replace the template placeholders
    // that are used in the error message
    if (this.context.internalTables.length === 1) {
      const replacements = { table: this.context.internalTables[0].tableName };
      modifiedErrorMessage = replaceTemplateStrings(modifiedErrorMessage, replacements);
    }

    // Based on the internalTables in context replace table UUIDs in
    // the error message
    modifiedErrorMessage = replaceTableUUIDs(modifiedErrorMessage, internalTableEntries);
    modifiedErrorMessage = maskWorkspaceSchemaNameInErrorMessage(modifiedErrorMessage);
    return modifiedErrorMessage;
  }

  postgrestDetailsParser(): Record<string, string> | null {
    const parsers = {
      [PostgresErrorCode.NotNullViolation]: () => {
        const errorMessage = this.queryError.driverError.message;
        const regex = /null value in column "(.*?)" of relation "(.*?)" violates not-null constraint/;
        const matches = regex.exec(errorMessage);
        const table = this.context.internalTables[0].tableName;
        return { table, column: matches[1], value: matches[2] };
      },
      [PostgresErrorCode.UniqueViolation]: () => {
        const errorMessage = this.queryError.driverError['details'];
        const regex = /Key \((.*?)\)=\((.*?)\) already exists\./;
        const matches = regex.exec(errorMessage);
        const table = this.context.internalTables[0].tableName;
        return { table, column: matches[1], value: matches[2] };
      },
      [PostgresErrorCode.ForeignKeyViolation]: () => {
        const errorMessage = this.queryError.driverError['details'];
        const regex = /Key \((.*?)\)=\((.*?)\) (is still referenced from table|is not present in table) "(.*?)"\./;
        const matches = regex.exec(errorMessage);
        const table = this.context.internalTables[0].tableName;
        return { table, column: matches[1], value: matches[2], referencedTables: [matches[2]] };
      },
      [PostgresErrorCode.UndefinedFunction]: () => {
        const errorMessage = this.queryError.driverError.message;
        const regex = /function (\w+)\(([\w\s]+)\) does not exist/;
        const matches = regex.exec(errorMessage);
        const table = this.context.internalTables[0].tableName;
        if (Array.isArray(matches) && matches.length) return { table, fxName: matches[1] };
        return null;
      },
    };
    return parsers[this.code]?.() || null;
  }
}
