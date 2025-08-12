import got, { HTTPError, OptionsOfTextResponseBody } from "got";

import {
  QueryError,
  QueryResult,
  QueryService,
  User,
  App,
  validateAndSetRequestOptionsBasedOnAuthType,
} from "@tooljet-marketplace/common";

import {
  SourceOptions,
  QueryOptions,
  ConvertedFormat,
  AccessDetailsFromParams,
} from "./types";

export default class Gmail implements QueryService {
  private validateSourceOptions(sourceOptions: SourceOptions) {
    const { client_id, client_secret } = sourceOptions;

    if (!client_id?.value || !client_secret?.value) {
      const error = new Error(
        "Missing required source options: client_id and client_secret."
      );

      throw error;
    }
  }

  authUrl(sourceOptions: SourceOptions): string {
    this.validateSourceOptions(sourceOptions);

    const { client_id, oauth_type } = sourceOptions;

    const clientId =
      oauth_type?.value === "tooljet_app"
        ? process.env.GOOGLE_CLIENT_ID
        : client_id?.value;

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const redirectBaseUrl = `${host}${subpath ? subpath : "/"}`;

    const scope = encodeURIComponent("https://mail.google.com");

    const baseUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?response_type=code&client_id=${clientId.trim()}` +
      `&redirect_uri=${redirectBaseUrl}oauth2/authorize`;

    const authUrl = `${baseUrl}&scope=${scope}&access_type=offline&prompt=consent`;

    return authUrl;
  }

  async accessDetailsFrom(
    authCode: AccessDetailsFromParams["authCode"],
    sourceOptions: AccessDetailsFromParams["sourceOptions"],
    resetSecureData?: AccessDetailsFromParams["resetSecureData"]
  ) {
    if (resetSecureData) {
      return [
        ["access_token", ""],
        ["refresh_token", ""],
      ];
    }

    let clientId: string | undefined, clientSecret: string | undefined, oauth_type: string | undefined

    for (const item of sourceOptions) {
      if (item.key === "client_id") {
        clientId = item.value;
      }
      if (item.key === "client_secret") {
        clientSecret = item.value;
      }
      if (item.key === "oauth_type") {
        oauth_type = item.value;
      }
    }

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.GOOGLE_CLIENT_ID;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    }

    this.validateSourceOptions({
      client_id: { value: clientId },
      client_secret: { value: clientSecret },
    } as SourceOptions);

    const accessTokenUrl = "https://oauth2.googleapis.com/token";
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;

    const fullUrl = `${host}${subpath ? subpath : "/"}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    const grantType = "authorization_code";
    const customParams = { prompt: "consent", access_type: "offline" };

    const data = {
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      redirect_uri: redirectUri,
      ...customParams,
    };

    const authDetails = [];

    try {
      const response = await got(accessTokenUrl, {
        method: "post",
        form: data, // Use form instead of json
        responseType: 'json' // Automatically parse JSON response
      });

      const result = response.body; // No manual JSON.parse needed

      if (response.statusCode !== 200) {
        throw Error("Could not connect to Gmail");
      }

      if (result["access_token"]) {
        authDetails.push(["access_token", result["access_token"]]);
      }

      if (result["refresh_token"]) {
        authDetails.push(["refresh_token", result["refresh_token"]]);
      }
    } catch (error) {
      throw Error("Could not connect to Gmail");
    }

    return authDetails;
  }

  private getAuthHeader(token: string) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async refreshToken(sourceOptions: any) {
    if (!sourceOptions["refresh_token"]) {
      throw new QueryError(
        "Query could not be completed",
        "Refresh token not found in source options",
        {
          error: "Refresh token is required to refresh the access token.",
        }
      );
    }

    const accessTokenUrl = "https://oauth2.googleapis.com/token";
    const grantType = "refresh_token";

    const clientId = sourceOptions.client_id;
    const clientSecret = sourceOptions.client_secret;
    const refreshToken = sourceOptions.refresh_token;

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      refresh_token: refreshToken,
    };

    const accessTokenDetails = {};

    try {
      const response = await got(accessTokenUrl, {
        method: "post",
        form: data, // Use form instead of json
        responseType: 'json' // Automatically parse JSON response
      });

      const result = response.body; // No manual JSON.parse needed

      if (!(response.statusCode >= 200 && response.statusCode < 300)) {
        throw new QueryError(
          "Query could not be completed",
          "Could not connect to Gmail",
          {
            statusCode: response.statusCode,
            statusText: response.statusMessage,
            error: response.body,
          }
        );
      }

      if (result["access_token"]) {
        accessTokenDetails["access_token"] = result["access_token"];
        accessTokenDetails["refresh_token"] = result["refresh_token"];
      } else {
        throw new QueryError(
          "Query could not be completed",
          "Access token not found in the response",
          {
            statusCode: response.statusCode,
            statusText: response.statusMessage,
            error: response.body,
          }
        );
      }
    } catch (error) {
      throw new QueryError(
        "Query could not be completed",
        error.message || "An unexpected error occurred",
        {
          error: error instanceof Error ? error.message : error,
        }
      );
    }

    return accessTokenDetails;
  }

  private validateQueryOptions(queryOptions: QueryOptions) {
    const { operation, path } = queryOptions;

    if (!operation || !path) {
      throw new QueryError(
        "Query could not be completed",
        "Missing required query options",
        {
          operation: !!operation,
          path: !!path,
        }
      );
    }
  }

  async run(
    sourceOptions: any,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    let result = {};

    if (sourceOptions["oauth_type"] === "tooljet_app") {
      sourceOptions["client_id"] = process.env.GOOGLE_CLIENT_ID;
      sourceOptions["client_secret"] = process.env.GOOGLE_CLIENT_SECRET;
    }

    try {
      this.validateQueryOptions(queryOptions);

      const { operation, path, params } = queryOptions;

      const accessToken = sourceOptions["access_token"];

      const baseUrl = "https://gmail.googleapis.com";
      let url = `${baseUrl}${path}`;

      const pathParams = params.path || {};
      const queryParams = params.query || {};
      const bodyParams = params.request || {};

      for (const param of Object.keys(pathParams)) {
        url = url.replace(`{${param}}`, pathParams[param]);
      }

      let requestOptions;

      if (sourceOptions["multiple_auth_enabled"]) {
        const customHeaders = { "tj-x-forwarded-for": "::1" };

        const newSourceOptions = this.constructSourceOptions(sourceOptions);

        const authValidatedRequestOptions = this.convertQueryOptions(
          queryOptions,
          customHeaders
        );

        const _requestOptions =
          await validateAndSetRequestOptionsBasedOnAuthType(
            newSourceOptions,
            context,
            authValidatedRequestOptions as any
          );

        if (_requestOptions.status === "needs_oauth") return _requestOptions;

        requestOptions = _requestOptions.data as OptionsOfTextResponseBody;
      } else {
        const hasBody = !["get", "delete"].includes(operation.toLowerCase());
        
        requestOptions = {
          method: operation,
          headers: this.getAuthHeader(accessToken),
          searchParams: queryParams,
          responseType: 'json'
        };

        // Only add JSON body for non-GET/DELETE requests
        if (hasBody && bodyParams && Object.keys(bodyParams).length > 0) {
          requestOptions.json = bodyParams;
        }
      }

      const response = await got(url, requestOptions);

      if (response && response.body) {
        result = response.body;
      } else {
        result = "Query Success";
      }
    } catch (error) {
      if (error instanceof QueryError) {
        throw error;
      }

      // Handle http errors from got
      if (error instanceof HTTPError && error.response) {
        const errorText = error.response.body || "No response body";
        const statusCode = error.response.statusCode || 500;

        const queryError = new QueryError(
          "Query could not be completed",
          `Failed to fetch data: ${statusCode} ${error.response.statusMessage}`,
          {
            status: statusCode,
            statusText: error.response.statusMessage,
            errors: errorText,
          }
        );

        throw queryError;
      }

      const queryError = new QueryError(
        "Query could not be completed",
        error.message || "An unexpected error occurred",
        {
          error: error,
        }
      );

      throw queryError;
    }

    return {
      status: "ok",
      data: result,
    };
  }

  private convertQueryOptions(
    queryOptions: any,
    customHeaders?: Record<string, string>
  ): any {
    // Extract operation and params
    const { operation, params } = queryOptions;

    // Start building the result
    const result: ConvertedFormat = {
      method: operation.toLowerCase(),
      headers: customHeaders || {},
    };

    // Convert query params to URLSearchParams if they exist
    if (params.query && Object.keys(params.query).length > 0) {
      const urlParams = new URLSearchParams();

      Object.entries(params.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => urlParams.append(key, String(v)));
          } else {
            urlParams.append(key, String(value));
          }
        }
      });

      result.searchParams = urlParams;
    }

    if (!["get", "delete"].includes(result.method) && params.request) {
      result.json = params.request;
    }

    return result;
  }

  private constructSourceOptions(sourceOptions) {
    const baseUrl = "https://gmail.googleapis.com";
    const authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const scope = "https://mail.google.com";

    const addSourceOptions = {
      url: baseUrl,
      auth_url: authUrl,
      add_token_to: "header",
      header_prefix: "Bearer ",
      access_token_url: "https://oauth2.googleapis.com/token",
      audience: "",
      username: "",
      password: "",
      bearer_token: "",
      client_auth: "header",
      headers: [
        ["", ""],
        ["tj-x-forwarded-for", "::1"],
      ],
      custom_query_params: [["", ""]],
      custom_auth_params: [["", ""]],
      access_token_custom_headers: [["", ""]],
      ssl_certificate: "none",
      retry_network_errors: true,

      scopes: encodeURIComponent(scope),
    };

    const newSourceOptions = {
      ...sourceOptions,
      ...addSourceOptions,
    };

    return newSourceOptions;
  }
}
