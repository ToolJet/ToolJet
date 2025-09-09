import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, CustomerType } from './types';
import got, { HTTPError, Method } from 'got';

export default class Fedex implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    try {
      this.validateSourceOptions(sourceOptions);
      this.validateQueryOptions(queryOptions);

      const { accessToken } = await this.generateOAuthToken(sourceOptions);
      const { operation, path, params } = queryOptions;

      // Build resolved path
      let resolvedPath = path;
      for (const [key, value] of Object.entries(params.path || {})) {
        resolvedPath = resolvedPath.replace(
          `{${key}}`,
          encodeURIComponent(value)
        );
      }

      const baseUrl = "https://apis-sandbox.fedex.com";

      const fullUrl = new URL(`${baseUrl}${resolvedPath}`);

      // Append query parameters
      for (const [key, value] of Object.entries(params.query || {})) {
        if (value !== undefined && value !== null) {
          fullUrl.searchParams.append(key, value);
        }
      }

      const method = operation.toUpperCase();
      const hasBody = ["POST", "PUT", "PATCH"].includes(method);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      };

      if (hasBody) {
        headers["Content-Type"] = "application/json";
      }

      const response = await got(fullUrl.toString(), {
        method: method.toLowerCase() as Method,
        headers,
        json: hasBody ? params.request : undefined,
        responseType: 'json'
      });

      const responseData = response.body;

      return {
        status: "ok",
        data: responseData as any,
      };
    } catch (error) {
      if (error instanceof QueryError) {
        throw error;
      }

      throw this.parseHttpError(error, "Failed to fetch data");
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      this.validateSourceOptions(sourceOptions);

      const { accessToken } = await this.generateOAuthToken(sourceOptions);

      // Use the access token to make a test API call to verify connectivity
      const baseUrl = "https://apis-sandbox.fedex.com";
      const testUrl = `${baseUrl}/rate/v1/rates/quotes`;

      await got.post(testUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        json: {},
        responseType: 'json',
      });

      return {
        status: 'ok',
        message: 'Connection successful',
      };
    } catch (err) {
      if (err instanceof QueryError) {
        throw new Error(err.description || err.message);
      }

      throw err;
    }
  }

  private async generateOAuthToken(sourceOptions: SourceOptions) {
    const baseUrl = "https://apis-sandbox.fedex.com";
    const tokenUrl = `${baseUrl}/oauth/token`;

    const { client_id, client_secret, customer_type, child_key, child_secret } = sourceOptions;

    const formData: Record<string, string> = {
      client_id,
      client_secret,
    }

    if (!customer_type) {
      // Standard OAuth Client Credentials flow
      formData['grant_type'] = 'client_credentials';
    } else if (customer_type === CustomerType.INTERNAL) {
      // Internal Customers flow
      formData['grant_type'] = 'csp_credentials';
      formData['child_key'] = child_key;
      formData['child_secret'] = child_secret;
    } else if (customer_type === CustomerType.PROPRIETARY_PARENT_CHILD) {
      // Proprietary Parent-Child Customers flow
      formData['grant_type'] = 'client_pc_credentials';
      formData['child_key'] = child_key;
      formData['child_secret'] = child_secret;
    }

    try {
      const response = await got.post(tokenUrl, {
        form: formData,
        responseType: 'json',
      });

      const data = response.body as any;

      if (!data.access_token) {
        throw new QueryError(
          "Query could not be completed",
          "Access token missing in response",
          {
            status: response.statusCode,
            statusText: response.statusMessage,
            errors: data,
          }
        );
      }

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      if (error instanceof QueryError) {
        throw error;
      }

      throw this.parseHttpError(error, "Failed to obtain OAuth token from FedEx");
    }
  }

  private parseHttpError(error: any, defaultMessage: string): QueryError {
    let errorMessage = defaultMessage;
    let errorDetails: Record<string, any> = {};

    if (error instanceof HTTPError && error.response) {
      errorMessage = `HTTP ${error.response.statusCode}: ${error.response.statusMessage || "Request failed"
        }`;
      errorDetails = {
        status: error.response.statusCode,
        statusText: error.response.statusMessage,
        errors: error.response.body,
      };

      try {
        const errorBody =
          typeof error.response.body === "string"
            ? JSON.parse(error.response.body)
            : error.response.body;

        if (errorBody.errors && Array.isArray(errorBody.errors)) {
          errorMessage = errorBody.errors[0]?.message || errorMessage;
          errorDetails.errors = errorBody.errors;
        } else if (errorBody.error) {
          errorMessage = errorBody.error.message || errorMessage;
          errorDetails.errors = errorBody.error;
        }
      } catch (parseError) {
        // Keep the raw response body if parsing fails
      }
    } else {
      errorMessage = error.message || "An unexpected error occurred";
      errorDetails = { cause: error };
    }

    return new QueryError("Query could not be completed", errorMessage, errorDetails);
  }

  private validateSourceOptions(sourceOptions: SourceOptions) {
    const { client_id, client_secret, customer_type } =
      sourceOptions;

    if (!client_id || !client_secret) {
      throw new QueryError(
        "Query could not be completed",
        "Missing required source options",
        {
          client_id: !!client_id,
          client_secret: !!client_secret,
        }
      );
    }

    if (customer_type && !Object.values(CustomerType).includes(customer_type)) {
      throw new QueryError(
        "Query could not be completed",
        "Invalid customer type, expected 'internal_customers' or 'proprietary_parent_child_customers'",
        {
          customer_type: customer_type,
        }
      );
    }

    if (customer_type) {
      const { child_key, child_secret } = sourceOptions;

      if (!child_key || !child_secret) {
        throw new QueryError(
          "Query could not be completed",
          "Missing required child credentials for the selected customer type",
          {
            child_key: !!child_key,
            child_secret: !!child_secret,
          }
        );
      }
    }
  }

  private validateQueryOptions(queryOptions: QueryOptions) {
    const { operation, specType, path } = queryOptions;

    if (!operation || !specType || !path) {
      throw new QueryError(
        "Query could not be completed",
        "Missing required query options",
        {
          operation: !!operation,
          specType: !!specType,
          path: !!path,
        }
      );
    }

    if (
      !["get", "post", "put", "patch", "delete"].includes(
        operation.toLowerCase()
      )
    ) {
      throw new QueryError(
        "Query could not be completed",
        "Invalid operation, expected 'get', 'post', 'put', 'patch', or 'delete'",
        {
          operation: operation,
        }
      );
    }
  }
}
