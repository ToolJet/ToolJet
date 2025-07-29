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
import got, { OptionsOfTextResponseBody } from "got";

export default class Gmail implements QueryService {
  authUrl(sourceOptions: SourceOptions): string {
    console.log("Generating auth URL for Gmail with options:", sourceOptions);

    const { client_id, oauth_type } = sourceOptions;

    const clientId =
      oauth_type?.value === "tooljet_app"
        ? process.env.GOOGLE_CLIENT_ID
        : client_id?.value;

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const redirectBaseUrl = `${host}${subpath ? subpath : "/"}`;

    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/gmail.readonly"
    );

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
    console.log(
      "Fetching access details from Gmail with auth code:",
      authCode,
      "and source options:",
      sourceOptions
    );

    if (resetSecureData) {
      return [
        ["access_token", ""],
        ["refresh_token", ""],
      ];
    }

    // ToDo: Better type annotation for sourceOptions
    let clientId: string | undefined, clientSecret: string | undefined;

    for (const item of sourceOptions) {
      if (item.key === "client_id") {
        clientId = item.value;
      }
      if (item.key === "client_secret") {
        clientSecret = item.value;
      }
    }

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
        json: data,
        headers: { "Content-Type": "application/json" },
      });

      const result = JSON.parse(response.body);

      if (response.statusCode !== 200) {
        throw Error("Could not connect to Gmail");
      }

      // ToDo: Remove debug logs

      console.log("Received access details:", result);

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
      "Content-Type": "application/json",
    };
  }

  async refreshToken(sourceOptions: any) {
    console.log("Refreshing token for Gmail with options:", sourceOptions);

    if (!sourceOptions["refresh_token"]) {
      throw new QueryError(
        "Query could not be completed",
        "Refresh token empty",
        {}
      );
    }
    const accessTokenUrl = "https://oauth2.googleapis.com/token";
    const clientId = sourceOptions.client_id;
    const clientSecret = sourceOptions.client_secret;
    const grantType = "refresh_token";

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      refresh_token: sourceOptions["refresh_token"],
    };

    const accessTokenDetails = {};

    try {
      const response = await got(accessTokenUrl, {
        method: "post",
        json: data,
        headers: { "Content-Type": "application/json" },
      });
      const result = JSON.parse(response.body);

      if (!(response.statusCode >= 200 || response.statusCode < 300)) {
        throw new QueryError(
          "Could not connect to Gmail",
          JSON.stringify({
            statusCode: response?.statusCode,
            message: response?.body,
          }),
          {}
        );
      }

      if (result["access_token"]) {
        accessTokenDetails["access_token"] = result["access_token"];
        accessTokenDetails["refresh_token"] = result["refresh_token"];
      } else {
        throw new QueryError(
          "access_token not found in the response",
          {},
          {
            responseObject: {
              statusCode: response.statusCode,
              responseBody: response.body,
            },
            responseHeaders: response.headers,
          }
        );
      }
    } catch (error) {
      console.error(
        `Error while REST API refresh token call. Status code : ${error.response?.statusCode}, Message : ${error.response?.body}`
      );
      throw new QueryError(
        "Could not connect to Gmail",
        JSON.stringify({
          statusCode: error.response?.statusCode,
          message: error.response?.body,
        }),
        {}
      );
    }
    return accessTokenDetails;
  }

  async run(
    sourceOptions: any,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    console.log(
      "Running query for Gmail with source options:",
      sourceOptions,
      "and query options:",
      queryOptions,
      "context:",
      context
    );

    let result = {};
    if (sourceOptions["oauth_type"] === "tooljet_app") {
      sourceOptions["client_id"] = process.env.GOOGLE_CLIENT_ID;
      sourceOptions["client_secret"] = process.env.GOOGLE_CLIENT_SECRET;
    }

    const operation = queryOptions.operation;
    const accessToken = sourceOptions["access_token"];

    const baseUrl = "https://gmail.googleapis.com";
    const path = queryOptions["path"];
    let url = `${baseUrl}${path}`;

    const pathParams = queryOptions["params"]["path"];
    const queryParams = queryOptions["params"]["query"];
    const bodyParams = queryOptions["params"]["request"];

    for (const param of Object.keys(pathParams)) {
      url = url.replace(`{${param}}`, pathParams[param]);
    }

    let requestOptions;
    if (sourceOptions["multiple_auth_enabled"]) {
      const customHeaders = { "tj-x-forwarded-for": "::1" };
      const newSourcOptions = this.constructSourceOptions(sourceOptions);
      const authValidatedRequestOptions = this.convertQueryOptions(
        queryOptions,
        customHeaders
      );

      const _requestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        newSourcOptions,
        context,
        authValidatedRequestOptions as any
      );
      if (_requestOptions.status === "needs_oauth") return _requestOptions;
      requestOptions = _requestOptions.data as OptionsOfTextResponseBody;
    } else {
      requestOptions =
        operation === "get" || operation === "delete"
          ? {
              method: operation,
              headers: this.getAuthHeader(accessToken),
              searchParams: queryParams,
            }
          : {
              method: operation,
              headers: this.getAuthHeader(accessToken),
              json: bodyParams,
              searchParams: queryParams,
            };
    }
    try {
      const response = await got(url, requestOptions);
      if (response && response.body) {
        try {
          result = JSON.parse(response.body);
        } catch (parseError) {
          result = response.body;
        }
      } else {
        result = "Query Success";
      }
    } catch (error) {
      const errorMessage =
        error?.message === "Query could not be completed"
          ? error?.description
          : error?.message;
      throw new QueryError(
        "Query could not be completed",
        errorMessage,
        error?.data || {}
      );
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
    const scope = "https://www.googleapis.com/auth/gmail.readonly";

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

    const newSourcOptions = {
      ...sourceOptions,
      ...addSourceOptions,
    };

    return newSourcOptions;
  }
}
