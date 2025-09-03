import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-marketplace/common";
import {
  BedrockRuntimeClient,
  BedrockRuntimeServiceException,
} from "@aws-sdk/client-bedrock-runtime";
import { SourceOptions, QueryOptions } from "./types";
import { generateContent, listFoundationModels } from "./query_operations";
import { BedrockServiceException } from "@aws-sdk/client-bedrock";
import { BedrockClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock";
export default class AWSBedrock implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string
  ): Promise<QueryResult> {
    const runtimeClient = this.createClient(sourceOptions);
    const bedrockClient = new BedrockClient({
      region: sourceOptions.region,
      credentials: this.createCredentials(sourceOptions),
    });

    try {
      let data;
      switch (queryOptions.operation) {
        case "generate_content":
          if (!queryOptions.model_id || !queryOptions.request_body) {
            throw new QueryError(
              "Validation failed",
              "Model ID and request body are required",
              {
                validation: {
                  model_id: !queryOptions.model_id ? "missing" : "valid",
                  request_body: !queryOptions.request_body ? "missing" : "valid"
                }
              }
            );
          }
          data = await generateContent(runtimeClient, {
            model_id: queryOptions.model_id,
            request_body: queryOptions.request_body,
            content_type: queryOptions.content_type,
          });
          break;

        case "list_foundation_models":
          data = await listFoundationModels(bedrockClient, {
            customization_type: queryOptions.customization_type,
            inference_type: queryOptions.inference_type,
            output_modality: queryOptions.output_modality,
            provider: queryOptions.provider,
          });
          break;

        default:
          throw new QueryError(
            "Invalid operation",
            `Unsupported operation: ${queryOptions.operation}`,
            {
              supported_operations: ["generate_content", "list_foundation_models"]
            }
          );
      }

      return {
        status: "ok",
        data,
      };
    } catch (error) {
      // Standardized error handling
      if (error instanceof QueryError) {
        throw error;
      }

      // Handle AWS SDK errors
      if (error instanceof BedrockRuntimeServiceException || error instanceof BedrockServiceException) {
        throw new QueryError(
          "AWS Bedrock Error",
          error.message,
          {
            aws_error: {
              name: error.name,
              code: error.$metadata?.httpStatusCode,
              request_id: error.$metadata?.requestId,
              cf_id: error.$metadata?.cfId,
              extended_request_id: error.$metadata?.extendedRequestId
            }
          }
        );
      }

      // Fallback for other errors
      throw new QueryError(
        "Operation failed",
        error.message || "Unknown error occurred",
        {
          error_type: error.constructor.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      );
    }
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    this.validateCredentials(sourceOptions);
    const credentials = this.createCredentials(sourceOptions);
    const bedrockClient = new BedrockClient({
      region: sourceOptions.region,
      credentials,
    });

    try {
      const command = new ListFoundationModelsCommand({});
      await bedrockClient.send(command);
      return { status: "ok" };
    } catch (error) {
      let errorMessage = "Connection test failed";
      const errorDetails: any = {};

      if (error instanceof BedrockServiceException) {
        errorMessage = "AWS Bedrock Connection Failed";
        errorDetails.aws_error = {
          name: error.name,
          code: error.$metadata?.httpStatusCode,
          request_id: error.$metadata?.requestId
        };

        if (error.name === "CredentialsProviderError") {
          errorMessage = "Invalid AWS credentials";
        } else if (error.name === "AccessDeniedException") {
          errorMessage = "Insufficient permissions";
        }
      }

      throw new QueryError(
        errorMessage,
        error.message,
        errorDetails
      );
    }
  }

  private validateCredentials(sourceOptions: SourceOptions): void {
    const hasAccessKey = sourceOptions.access_key && sourceOptions.secret_access_key;
    const hasSessionToken = sourceOptions.session_token;

    if (hasSessionToken && !hasAccessKey) {
      throw new QueryError(
        "Invalid credentials configuration",
        "Session tokens require temporary credentials (access key + secret + token)",
        {
          validation: {
            error: "session_token_requires_access_keys"
          }
        }
      );
    }

    if (!hasAccessKey) {
      throw new QueryError(
        "Invalid credentials configuration",
        "Access key and secret access key are required",
        {
          validation: {
            missing: "access_credentials_required"
          }
        }
      );
    }

    if (!sourceOptions.access_key.trim() || !sourceOptions.secret_access_key.trim()) {
      throw new QueryError(
        "Invalid credentials configuration",
        "Both access key and secret access key must be non-empty",
        {
          validation: {
            access_key: !sourceOptions.access_key.trim() ? "empty" : "valid",
            secret_access_key: !sourceOptions.secret_access_key.trim() ? "empty" : "valid"
          }
        }
      );
    }
  }

  private createCredentials(sourceOptions: SourceOptions) {
    this.validateCredentials(sourceOptions);
    if (sourceOptions.access_key && sourceOptions.secret_access_key) {
      return {
        accessKeyId: sourceOptions.access_key,
        secretAccessKey: sourceOptions.secret_access_key,
        sessionToken: sourceOptions.session_token ? sourceOptions.session_token : undefined
      };
    }
    throw new QueryError(
      "Invalid credentials configuration",
      "Session tokens require temporary credentials (access key + secret + token)",
      {
        validation: {
          error: "session_token_requires_temporary_credentials"
        }
      }
    );
  }

  private createClient(sourceOptions: SourceOptions): BedrockRuntimeClient {
    const credentials = this.createCredentials(sourceOptions);

    return new BedrockRuntimeClient({
      region: sourceOptions.region,
      credentials,
    });
  }
}