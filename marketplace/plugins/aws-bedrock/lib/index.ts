import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-marketplace/common";
import {
  BedrockRuntimeClient,
  BedrockClient,
  InvokeModelCommand,
  ListFoundationModelsCommand,
  BedrockRuntimeServiceException,
  BedrockServiceException
} from "@aws-sdk/client-bedrock-runtime";
import { SourceOptions, QueryOptions } from "./types";
import { generateContent, listFoundationModels } from "./query_operations";

export default class AWSBedrock implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string
  ): Promise<QueryResult> {
    const client = this.createClient(sourceOptions);

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
          data = await generateContent(client, {
            model_id: queryOptions.model_id,
            request_body: queryOptions.request_body,
            content_type: queryOptions.content_type,
          });
          break;

        case "list_foundation_models":
          data = await listFoundationModels(client, {
            customization_type: queryOptions.by_customization_type,
            inference_type: queryOptions.by_inference_type,
            output_modality: queryOptions.by_output_modality,
            provider: queryOptions.by_provider,
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
    const client = this.createClient(sourceOptions);

    try {
      const command = new ListFoundationModelsCommand({});
      await client.send(command);
      return { status: "ok" };
    } catch (error) {
      // Standardized connection test error
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

  private createClient(sourceOptions: SourceOptions): BedrockRuntimeClient {
    return new BedrockRuntimeClient({
      region: sourceOptions.region,
      credentials: {
        accessKeyId: sourceOptions.access_key,
        secretAccessKey: sourceOptions.secret_access_key,
        sessionToken: sourceOptions.session_token,
      },
    });
  }
}