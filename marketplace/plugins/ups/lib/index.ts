import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-marketplace/common";
import { SourceOptions, QueryOptions, BaseUrl } from "./types";
import got, { HTTPError, Method } from "got";

export default class Ups implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
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

      // Determine base URL
      const baseUrl = sourceOptions.base_url + "/api";

      const fullUrl = new URL(`${baseUrl}${resolvedPath}`);

      // Append query parameters
      for (const [key, value] of Object.entries(params.query || {})) {
        if (value !== undefined && value !== null) {
          fullUrl.searchParams.append(key, value);
        }
      }

      const method = operation.toUpperCase();
      const hasBody = ["POST", "PUT", "PATCH"].includes(method);

      // Prepare headers - only add Content-Type when body is present
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "x-merchant-id": sourceOptions.shipper_number!,
        Accept: "application/json",
      };

      // Add Content-Type only when there's a body
      if (hasBody) {
        headers["Content-Type"] = "application/json";
      }

      const response = await got(fullUrl.toString(), {
        method: method.toLowerCase() as Method,
        headers,
        json: hasBody ? params.request : undefined,
      });

      const responseData = JSON.parse(response.body);

      return {
        status: "ok",
        data: responseData,
      };
    } catch (error) {
      if (error instanceof QueryError) {
        throw error;
      }
      
      throw this.parseHttpError(error, "Failed to fetch data");
    }
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    try {
      this.validateSourceOptions(sourceOptions);
      const { accessToken } = await this.generateOAuthToken(sourceOptions);

      // Use a simple endpoint to test the connection
      const baseUrl = sourceOptions.base_url + "/api";
      const resolvedPath = "/track/v1/details/testing"; // Example path for testing
      const fullUrl = new URL(`${baseUrl}${resolvedPath}`);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "x-merchant-id": sourceOptions.shipper_number!,
        Accept: "application/json",
        transID: "testing",
        transactionSrc: "testing",
      };

      await got(fullUrl.toString(), {
        method: "get",
        headers,
      });

      return {
        status: "ok",
        message: "Connection successful",
      };
    } catch (err) {
      // Convert QueryError to regular Error for better UX in config page
      if (err instanceof QueryError) {
        throw new Error(err.description || err.message);
      }
      
      throw err;
    }
  }

  private async generateOAuthToken(sourceOptions: SourceOptions) {
    const { client_id, client_secret, base_url, shipper_number } =
      sourceOptions;

    const headers = {
      "x-merchant-id": shipper_number,
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${client_id}:${client_secret}`
      ).toString("base64")}`,
    };

    const body = new URLSearchParams();
    body.append("grant_type", "client_credentials");

    const url = `${base_url}/security/v1/oauth/token`;

    try {
      const response = await got(url, {
        method: "post",
        headers,
        body: body.toString(),
      });

      const data = JSON.parse(response.body);

      if (!data.access_token || !data.expires_in) {
        throw new QueryError(
          "Query could not be completed",
          "Access token or expiration time is missing",
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
      throw this.parseHttpError(error, "Failed to authenticate with UPS");
    }
  }

  private parseHttpError(error: any, defaultMessage: string): QueryError {
    let errorMessage = defaultMessage;
    let errorDetails: Record<string, any> = {};

    if (error instanceof HTTPError && error.response) {
      errorMessage = `HTTP ${error.response.statusCode}: ${
        error.response.statusMessage || "Request failed"
      }`;
      errorDetails = {
        status: error.response.statusCode,
        statusText: error.response.statusMessage,
        errors: error.response.body,
      };

      // Try to parse UPS-specific error format
      try {
        const errorBody =
          typeof error.response.body === "string"
            ? JSON.parse(error.response.body)
            : error.response.body;
        if (errorBody.response && errorBody.response.errors) {
          errorMessage = errorBody.response.errors[0]?.message || errorMessage;
          errorDetails.errors = errorBody.response.errors;
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
    const { client_id, client_secret, shipper_number, base_url } =
      sourceOptions;

    if (!client_id || !client_secret || !shipper_number || !base_url) {
      throw new QueryError(
        "Query could not be completed",
        "Missing required source options",
        {
          client_id: !!client_id,
          client_secret: !!client_secret,
          shipper_number: !!shipper_number,
          base_url: !!base_url,
        }
      );
    }

    if (!Object.values(BaseUrl).includes(base_url)) {
      throw new QueryError(
        "Query could not be completed",
        "Invalid environment, expected 'production' or 'cie'",
        {
          base_url: base_url,
        }
      );
    }
  }

  private validateQueryOptions(queryOptions: QueryOptions) {
    const { operation, specType } = queryOptions;

    if (!operation || !specType) {
      throw new QueryError(
        "Query could not be completed",
        "Missing required query options",
        {
          operation: !!operation,
          specType: !!specType,
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
