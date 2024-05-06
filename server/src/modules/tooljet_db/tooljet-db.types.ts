import { InternalTable } from 'src/entities/internal_table.entity';
import { QueryFailedError } from 'typeorm';
import { DatabaseError } from 'pg-protocol';

enum PostgresErrorCode {
  UniqueViolation = '23505',
  CheckViolation = '23514',
  NotNullViolation = '23502',
  ForeignKeyViolation = '23503',
}

export type TooljetDbOperations = 'edit_column' | 'postgrest' | 'edit_table' | 'add_column';

interface ErrorCodeMapping {
  [PostgresErrorCode.NotNullViolation]: {
    [key in TooljetDbOperations | 'default']?: string;
  };
  [PostgresErrorCode.UniqueViolation]: {
    [key in TooljetDbOperations | 'default']?: string;
  };
}

const errorCodeMapping: ErrorCodeMapping = {
  [PostgresErrorCode.NotNullViolation]: {
    edit_column: 'Cannot add NOT NULL constraint as this column contains NULL values',
    postgrest: 'Not null constraint violated for {{table}}.{{column}}',
    default: 'Cannot add NOT NULL constraint',
  },
  [PostgresErrorCode.UniqueViolation]: {
    edit_table: 'Cannot add UNIQUE constraint as column contains duplicate values',
    edit_column: 'Cannot add UNIQUE constraint as this column contains duplicate values',
    postgrest: 'Unique constraint violated as {{value}} already exists in {{table}}.{{column}}',
    default: 'Cannot add UNIQUE Key constraint',
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
    origin: string;
    internalTables: InternalTable[] | { id: string; tableName: string }[];
  };
  public readonly queryError: QueryFailedError;

  constructor(
    message: string,
    context: {
      origin: TooljetDbOperations;
      internalTables: InternalTable[] | { id: string; tableName: string }[];
    },
    errorObj: QueryFailedError
  ) {
    const { parameters, driverError } = errorObj;

    super(message, parameters, driverError);
    this.context = context;
    this.code = errorObj.driverError.code;
    this.queryError = errorObj;
  }

  toString(): string {
    const errorMessage =
      errorCodeMapping[this.code][this.context.origin] || errorCodeMapping[this.code]['default'] || this.message;

    return this.replaceErrorPlaceholders(errorMessage);
  }

  replaceErrorPlaceholders(errorMessage: string) {
    let modifiedErrorMessage = errorMessage;
    const internalTableEntries = this.context.internalTables.map((t) => [t.id, t.tableName]);

    const replaceTemplateStrings = (
      errorMessage: string,
      replacements: {
        [key: string]: string;
      }
    ): string => {
      return Object.entries(replacements).reduce((message, [key, value]) => {
        return message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }, errorMessage);
    };

    const replaceTableUUIDs = (errorMessage: string, internalTableEntries: string[][]) => {
      return internalTableEntries.reduce((acc, [key, value]) => {
        return acc.replace(new RegExp(key, 'g'), value);
      }, errorMessage);
    };

    if (this.queryError.driverError instanceof DatabaseError) {
      modifiedErrorMessage = replaceTemplateStrings(errorMessage, {
        table: this.queryError.driverError.table,
        column: this.queryError.driverError.column,
      });
    } else if (this.queryError.driverError instanceof PostgrestError) {
      modifiedErrorMessage = replaceTemplateStrings(errorMessage, this.postgrestDetailsParser());
    }

    modifiedErrorMessage = replaceTableUUIDs(modifiedErrorMessage, internalTableEntries);
    return modifiedErrorMessage;
  }

  postgrestDetailsParser(): { [key: string]: string } {
    const parsers = {
      [PostgresErrorCode.NotNullViolation]: () => {
        const errorMessage = this.queryError.driverError.message;
        const regex = /null value in column "(.*?)" of relation "(.*?)" violates not-null constraint/;
        const matches = regex.exec(errorMessage);
        const table = this.context.internalTables[0]['tableName'];

        return { table, column: matches[1], value: matches[2] };
      },
      [PostgresErrorCode.UniqueViolation]: () => {
        const errorMessage = this.queryError.driverError.details;
        const regex = /Key \((.*?)\)=\((.*?)\) already exists\./;
        const matches = regex.exec(errorMessage);
        const table = this.context.internalTables[0]['tableName'];

        return { table, column: matches[1], value: matches[2] };
      },
    };

    return parsers[this.code].call();
  }
}
