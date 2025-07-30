import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-marketplace/common";
import { SourceOptions, QueryOptions, BaseUrl } from "./types";

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

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "x-merchant-id": sourceOptions.shipper_number!,
        Accept: "application/json",
      };

      const method = operation.toUpperCase();
      const hasBody = ["POST", "PUT", "PATCH"].includes(method);

      const requestOptions: RequestInit = {
        method,
        headers,
        body: hasBody ? JSON.stringify(params.request) : undefined,
      };

      const response = await fetch(fullUrl.toString(), requestOptions);

      if (!response.ok) {
        const errorText = await response.text();

        const error = new QueryError(
          "Query could not be completed",
          `Failed to fetch data: ${response.status} ${response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
            errors: errorText,
          }
        );

        error.name = "QueryError";
        throw error;
      }

      const responseData = await response.json();

      return {
        status: "ok",
        data: responseData,
      };
    } catch (error) {
      if (error instanceof QueryError) {
        throw error;
      }

      const queryError = new QueryError(
        "Query could not be completed",
        error.message || "An unexpected error occurred",
        {
          cause: error,
        }
      );
      queryError.name = "QueryError";
      throw queryError;
    }
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    this.validateSourceOptions(sourceOptions);

    await this.generateOAuthToken(sourceOptions);

    return {
      status: "ok",
      message: "Connection successful",
    };
  }

  private async generateOAuthToken(sourceOptions: SourceOptions) {
    const { client_id, client_secret, base_url, shipper_number } =
      sourceOptions;

    const headers = new Headers();

    headers.append("x-merchant-id", shipper_number);
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    // Basic authorization header
    const base64Credentials = btoa(`${client_id}:${client_secret}`);
    headers.append("Authorization", `Basic ${base64Credentials}`);

    const body = new URLSearchParams();

    body.append("grant_type", "client_credentials");

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: body,
    };

    const baseUrl = base_url;
    const url = `${baseUrl}/security/v1/oauth/token`;

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const {
        response: { errors },
      } = await response.json();

      const errorMessage = errors?.[0]?.message || "Unknown error occurred";

      throw new QueryError("Query could not be completed", errorMessage, {
        status: response.status,
        statusText: response.statusText,
        errors: errors,
      });
    }

    const data = await response.json();

    if (!data.access_token || !data.expires_in) {
      throw new QueryError(
        "Query could not be completed",
        "Access token or expiration time is missing",
        {
          status: response.status,
          statusText: response.statusText,
          errors: data,
        }
      );
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
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
  }
}
