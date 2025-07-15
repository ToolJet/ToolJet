import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-marketplace/common";
import { SourceOptions, QueryOptions, Dialect } from "./types";
import { Spanner as GoogleSpanner, Instance } from "@google-cloud/spanner";

export default class Spanner implements QueryService {
  private validateSourceOptions(sourceOptions: SourceOptions) {
    const { project_id, client_email, private_key, instance_id } =
      sourceOptions;

    if (!project_id || !client_email || !private_key || !instance_id) {
      throw new QueryError(
        "Missing credentials",
        "Required Spanner credentials are missing",
        {
          project_id: !!project_id,
          client_email: !!client_email,
          private_key: !!private_key,
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
      throw new Error();
    }

    return { spanner, instance };
  }

  private getDatabase(instance: Instance, databaseId?: string) {
    if (!databaseId) {
      throw new Error("Database ID is required");
    }

    const database = instance.database(databaseId);

    if (!database) {
      throw new Error(`Database with ID ${databaseId} not found`);
    }

    return database;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    this.validateSourceOptions(sourceOptions);

    const { client_email, project_id, private_key, instance_id } =
      sourceOptions;
    const { database_id } = queryOptions;

    try {
      const { instance } = this.getSpannerClient({
        projectId: project_id,
        credentials: {
          client_email: client_email,
          private_key: private_key,
        },
        instanceId: instance_id,
      });

      const database = this.getDatabase(instance, database_id);

      if (!queryOptions.sql || !queryOptions.dialect) {
        throw new Error(
          "SQL query and Dialect must be provided for running SQL queries"
        );
      }

      const { sql, query_params, param_types, dialect, options } = queryOptions;

      let parsedOptions: any = {};

      if (options) {
        try {
          parsedOptions = JSON.parse(options);
        } catch (e) {
          throw new QueryError(
            "Invalid options format",
            "The options field must be a valid JSON string",
            {
              options: options,
            }
          );
        }
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
    } catch (err: any) {
      throw new QueryError(
        "Query failed",
        err.message || "Unexpected Spanner error",
        {}
      );
    }
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    this.validateSourceOptions(sourceOptions);
    const { client_email, project_id, private_key, instance_id } =
      sourceOptions;

    try {
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
      const errorMessage = err.message || "An unknown error occurred";
      const errorDetails: any = {};

      throw new QueryError(
        "Connection test failed",
        errorMessage,
        errorDetails
      );
    }
  }

  private sanitizePrivateKey(key: string) {
    return key.replace(/\\n/g, "\n");
  }
}
