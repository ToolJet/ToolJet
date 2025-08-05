import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-marketplace/common";
import { SourceOptions, QueryOptions, Dialect } from "./types";
import { Spanner as GoogleSpanner, Instance } from "@google-cloud/spanner";

export default class Spanner implements QueryService {
  private getPrivateKey(configs?: string): {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  } {
    if (!configs) return {};

    try {
      return JSON.parse(configs);
    } catch (error) {
      throw new Error(`Invalid JSON in private key configuration: ${error.message}`);
    }
  }

  private validateSourceOptions(sourceOptions: SourceOptions) {
    const privateKey = this.getPrivateKey(sourceOptions?.private_key);
    const { instance_id } = sourceOptions;

    if (
      !privateKey?.project_id ||
      !privateKey?.client_email ||
      !privateKey?.private_key ||
      !instance_id
    ) {
      const error = new Error("Required Spanner credentials are missing");
      error.name = "InvalidSourceOptionsError";
      throw error;
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
      const error = new Error("Spanner instance not found");
      error.name = "InstanceNotFoundError";
      throw error;
    }

    return { spanner, instance };
  }

  private getDatabase(instance: Instance, databaseId?: string) {
    const database = instance.database(databaseId);

    if (!database) {
      const error = new Error(`Database with ID ${databaseId} not found`);
      error.name = "DatabaseNotFoundError";
      throw error;
    }

    return database;
  }

  private validateQueryOptions(queryOptions: QueryOptions) {
    const { sql, dialect, database_id } = queryOptions;

    if (!database_id || typeof database_id !== "string") {
      const error = new Error("Database ID must be a non-empty string");
      error.name = "InvalidDatabaseIdError";
      throw error;
    }

    if (!sql || typeof sql !== "string") {
      const error = new Error("SQL query must be a non-empty string");
      error.name = "InvalidQueryError";
      throw error;
    }

    if (!dialect || !Object.values(Dialect).includes(dialect)) {
      const error = new Error(
        "Invalid dialect. Must be 'Standard' or 'Postgres'"
      );
      error.name = "InvalidDialectError";
      throw error;
    }

    return queryOptions;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    try {
      this.validateSourceOptions(sourceOptions);
      this.validateQueryOptions(queryOptions);

      const { instance_id } = sourceOptions;
      const { project_id, client_email, private_key } = this.getPrivateKey(
        sourceOptions?.private_key
      );

      const { sql, query_params, database_id, param_types, dialect, options } =
        queryOptions;

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

      const [rows] = await database.run(runOptions);

      return { status: "ok", data: rows };
    } catch (err) {
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
    this.validateSourceOptions(sourceOptions);
    const { instance_id } = sourceOptions;
    const { project_id, client_email, private_key } = this.getPrivateKey(
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
  }

  private sanitizePrivateKey(key: string) {
    return key.replace(/\\n/g, "\n");
  }
}
