import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-marketplace/common";
import {
  BedrockClient,
  ListFoundationModelsCommand,
} from "@aws-sdk/client-bedrock";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { SourceOptions, QueryOptions } from "./types";
import { generateContent, listFoundationModels } from "./query_operations";

export default class AWSBedrock implements QueryService {
  private createRuntimeClient(
    sourceOptions: SourceOptions
  ): BedrockRuntimeClient {
    return new BedrockRuntimeClient({
      region: sourceOptions.region,
      credentials: {
        accessKeyId: sourceOptions.access_key,
        secretAccessKey: sourceOptions.secret_key,
        sessionToken: sourceOptions.session_token,
      },
    });
  }

  private createManagementClient(sourceOptions: SourceOptions): BedrockClient {
    return new BedrockClient({
      region: sourceOptions.region,
      credentials: {
        accessKeyId: sourceOptions.access_key,
        secretAccessKey: sourceOptions.secret_key,
        sessionToken: sourceOptions.session_token,
      },
    });
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string
  ): Promise<QueryResult> {
    try {
      let data;
      switch (queryOptions.operation) {
        case "generate_content":
          const runtimeClient = this.createRuntimeClient(sourceOptions);
          data = await generateContent(runtimeClient, {
            model_id: queryOptions.model_id,
            request_body: queryOptions.request_body,
            content_type: queryOptions.content_type,
          });
          break;

        case "list_foundation_models":
          const managementClient = this.createManagementClient(sourceOptions);
          data = await listFoundationModels(managementClient, {
            customization_type: queryOptions.by_customization_type,
            inference_type: queryOptions.by_inference_type,
            output_modality: queryOptions.by_output_modality,
            provider: queryOptions.by_provider,
          });
          break;

        default:
          throw new Error(`Unsupported operation: ${queryOptions.operation}`);
      }

      return {
        status: "ok",
        data,
      };
    } catch (error) {
      throw new QueryError(
        "Query could not be completed: " + error.message,
        error.message,
        {}
      );
    }
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    const client = this.createManagementClient(sourceOptions);

    try {
      await client.send(new ListFoundationModelsCommand({}));
      return { status: "ok" };
    } catch (error) {
      let errorMessage = "Could not establish connection to AWS Bedrock";

      if (error.name === "CredentialsProviderError") {
        errorMessage = "Invalid AWS credentials provided";
      } else if (error.name === "InvalidSignatureException") {
        errorMessage = "AWS credentials are invalid or expired";
      } else if (error.name === "AccessDeniedException") {
        errorMessage = "AWS credentials do not have sufficient permissions";
      }

      throw new QueryError(
        "Connection test failed",
        `${errorMessage}. Error: ${error.message}`,
        {}
      );
    }
  }
}
