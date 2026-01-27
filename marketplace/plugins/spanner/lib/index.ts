import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-marketplace/common";
import { SourceOptions, QueryOptions, Dialect, QueryMode } from "./types";
import { Database, Spanner as GoogleSpanner, Instance } from "@google-cloud/spanner";

export default class Spanner implements QueryService {
  private parsePrivateKey(key?: string): {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  } {
    if (!key) return {};

    try {
      return JSON.parse(key);
    } catch (error) {
      throw new QueryError(
        "Query could not be completed",
        `Invalid JSON in private key configuration: ${error.message}`,
        { cause: error }
      );
    }
  }

  private validateSourceOptions(sourceOptions: SourceOptions) {
    const parsedKey = this.parsePrivateKey(sourceOptions?.private_key);
    const { instance_id } = sourceOptions;

    if (
      !parsedKey?.project_id ||
      !parsedKey?.client_email ||
      !parsedKey?.private_key ||
      !instance_id
    ) {
      throw new QueryError(
        "Query could not be completed",
        "Required Spanner credentials are missing",
        {
          project_id: !!parsedKey?.project_id,
          client_email: !!parsedKey?.client_email,
          private_key: !!parsedKey?.private_key,
          instance_id: !!instance_id,
        }
      );
    }
  }

  private getSpannerClient({
    projectId,
    credentials,
    instanceId,
  }: {
    projectId: string;
    credentials: {
      client_email: string;
      private_key: string;
    };
    instanceId: string;
  }) {
    const spanner = new GoogleSpanner({
      projectId: projectId,
      credentials: {
        client_email: credentials.client_email,
        private_key: this.sanitizePrivateKey(credentials.private_key),
      },
    });

    const instance = spanner.instance(instanceId);

    if (!instance) {
      throw new QueryError(
        "Query could not be completed",
        "Spanner instance not found",
        { instanceId }
      );
    }

    return { spanner, instance };
  }

  private getDatabase(instance: Instance, databaseId?: string) {
    const database = instance.database(databaseId);

    if (!database) {
      throw new QueryError(
        "Query could not be completed",
        `Database with ID ${databaseId} not found`,
        { databaseId }
      );
    }

    return database;
  }

  private validateQueryOptions(queryOptions: QueryOptions) {
    const { sql, dialect, database_id, query_mode } = queryOptions;

    if (!database_id || typeof database_id !== "string") {
      throw new QueryError(
        "Query could not be completed",
        "Database ID must be a non-empty string",
        { database_id, type: typeof database_id }
      );
    }

    if (!sql || typeof sql !== "string") {
      throw new QueryError(
        "Query could not be completed",
        "SQL query must be a non-empty string",
        { sql, type: typeof sql }
      );
    }

    if (!dialect || !Object.values(Dialect).includes(dialect)) {
      throw new QueryError(
        "Query could not be completed",
        "Invalid dialect. Must be 'Standard' or 'Postgres'",
        { dialect, allowedValues: Object.values(Dialect) }
      );
    }

    if (query_mode && !Object.values(QueryMode).includes(query_mode)) {
      throw new QueryError(
        "Query could not be completed",
        "Invalid query mode. Must be 'read', 'write', or 'schema'",
        { query_mode, allowedValues: Object.values(QueryMode) }
      );
    }

    return queryOptions;
  }

  private async executeQuery(
    database: Database,
    runOptions: any,
    queryMode: QueryMode = QueryMode.Read
  ): Promise<any> {
    switch (queryMode) {
      case QueryMode.Read:
        // Read-only queries - no transaction needed
        const [rows] = await database.run(runOptions);

        return {
          type: 'READ',
          rows: rows.map(row => row.toJSON()),
          rowCount: rows.length
        };

      case QueryMode.Write:
        // DML queries - require transaction for consistency
        return await database.runTransactionAsync(async (transaction) => {
          const [rowCount] = await transaction.runUpdate(runOptions);
          await transaction.commit();

          return {
            type: 'WRITE',
            rowCount,
            affectedRows: rowCount
          };
        });

      case QueryMode.Schema:
        // DDL queries
        await database.updateSchema([runOptions.sql])

        return {
          type: 'SCHEMA',
          success: true,
          message: 'Schema operation completed successfully'
        };

      default:
        throw new QueryError(
          "Query could not be completed",
          `Unsupported query mode: ${queryMode}`,
          { queryMode }
        );
    }
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    try {
      this.validateSourceOptions(sourceOptions);
      this.validateQueryOptions(queryOptions);

      const { instance_id } = sourceOptions;
      const { project_id, client_email, private_key } = this.parsePrivateKey(
        sourceOptions?.private_key
      );

      const { 
        sql, 
        query_params, 
        database_id, 
        param_types, 
        dialect, 
        options,
        query_mode = QueryMode.Read // Default to read mode
      } = queryOptions;

      const { instance } = this.getSpannerClient({
        projectId: project_id,
        credentials: {
          client_email: client_email,
          private_key: private_key,
        },
        instanceId: instance_id,
      });

      const database = this.getDatabase(instance, database_id);

      let parsedOptions: any = {};

      try {
        if (options) parsedOptions = JSON.parse(options);
      } catch (parseError) {
        throw new QueryError(
          "Query could not be completed",
          "Invalid JSON in options",
          { message: parseError.message }
        );
      }

      const params: Record<string, any> = {};
      const types: Record<string, { type: string }> = {};

      if (dialect === Dialect.Standard) {
        if (query_params?.length) {
          for (const [key, value] of query_params) {
            if (key) params[key] = value;
          }
        }

        if (param_types?.length) {
          for (const [key, type] of param_types) {
            if (key && type) types[key] = { type };
          }
        }
      } else if (dialect === Dialect.Postgres) {
        if (query_params?.length) {
          query_params.forEach(([key, value], index) => {
            const mappedKey = `p${index + 1}`;
            params[mappedKey] = value;
          });
        }

        if (param_types?.length) {
          param_types.forEach(([key, type], index) => {
            const mappedKey = `p${index + 1}`;
            types[mappedKey] = { type };
          });
        }
      }

      const runOptions: any = {
        sql,
        params,
        types,
      };

      // Spread supported props from parsedOptions
      const supportedFields = [
        "queryOptions",
        "requestOptions",
        "gaxOptions",
        "timestampBounds",
        "json",
        "maxResumeRetries",
        "partitionToken",
        "seqno",
      ];

      for (const key of supportedFields) {
        if (key in parsedOptions) {
          runOptions[key] = parsedOptions[key];
        }
      }

      // Execute query based on the selected mode
      const result = await this.executeQuery(database, runOptions, query_mode);

      return { status: "ok", data: result };
    } catch (err) {
      // If it's already a QueryError, re-throw it
      if (err instanceof QueryError) {
        throw err;
      }

      // Handle other errors (like Spanner library errors)
      const errorMessage = err.message || "An unknown error occurred";
      const errorDetails: any = {};

      if (err instanceof Error) {
        const spannerError = err as any;

        errorDetails.code = spannerError.code ?? null;
        errorDetails.message = spannerError.details ?? spannerError.message;
        errorDetails.requestID = spannerError.requestID ?? null;
        errorDetails.note = spannerError.note ?? null;

        if (
          Array.isArray(spannerError.statusDetails) &&
          spannerError.statusDetails.length
        ) {
          errorDetails.localizedMessage =
            spannerError.statusDetails[0]?.message;
        }
      }

      throw new QueryError(
        "Query could not be completed",
        errorMessage,
        errorDetails
      );
    }
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    // For testConnection, we'll catch QueryErrors and convert them to regular errors
    // so they show proper error messages in the config page
    try {
      this.validateSourceOptions(sourceOptions);
      
      const { instance_id } = sourceOptions;
      const { project_id, client_email, private_key } = this.parsePrivateKey(
        sourceOptions?.private_key
      );

      const { instance } = this.getSpannerClient({
        projectId: project_id,
        credentials: {
          client_email: client_email,
          private_key: private_key,
        },
        instanceId: instance_id,
      });

      const exists = await instance.exists();

      if (!exists[0]) {
        throw new Error(
          `Instance with ID ${instance_id} does not exist or is not accessible`
        );
      }

      return { status: "ok" };
    } catch (err) {
      // Convert QueryError to regular Error for better UX in config page
      if (err instanceof QueryError) {
        throw new Error(err.description || err.message);
      }
      throw err;
    }
  }

  private sanitizePrivateKey(key: string) {
    return key.replace(/\\n/g, "\n");
  }
}
