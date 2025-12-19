import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from '@tooljet-marketplace/common';

import { SourceOptions, QueryOptions, Operation } from './types';

type ElevenLabsClient = {
  apiKey?: string;
};

export default class ElevenLabsAgentsService implements QueryService {
  /**
   * Execute query from ToolJet
   */
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    _dataSourceId: string
  ): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);

    let result: any;

    try {
      switch (operation) {
        case Operation.GetConversationToken:
          result = await this.getConversationToken(client, queryOptions);
          break;

        case Operation.GetSignedUrl:
          result = await this.getSignedUrl(client, queryOptions);
          break;

        default:
          throw new QueryError(
            'Query could not be completed',
            'Invalid operation',
            {}
          );
      }

      return {
        status: 'ok',
        data: result,
      };
    } catch (error: any) {
      console.error('Error in ElevenLabs query:', error);

      if (error instanceof QueryError) {
        throw error;
      }

      const errorMessage =
        error?.message ||
        error?.error?.message ||
        'Failed to execute ElevenLabs operation';

      throw new QueryError(
        'Query could not be completed',
        errorMessage,
        {
          statusCode: error?.status || error?.statusCode || 500,
        }
      );
    }
  }

  /**
   * Test connection (only validates API key for private agents)
   */
  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    const { auth_type } = sourceOptions;

    // Public agents do not require validation
    if (auth_type === 'public') {
      return { status: 'ok' };
    }

    const client = await this.getConnection(sourceOptions);

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': client.apiKey as string,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid ElevenLabs API key');
      }

      return { status: 'ok' };
    } catch (error: any) {
      throw new QueryError(
        'Connection could not be established',
        error?.message || 'Failed to validate API key',
        {
          statusCode: error?.status || 401,
        }
      );
    }
  }

  /**
   * Create ElevenLabs client
   */
  async getConnection(sourceOptions: SourceOptions): Promise<ElevenLabsClient> {
    const { auth_type, apiKey } = sourceOptions;

    if (auth_type === 'private' && !apiKey) {
      throw new QueryError(
        'Connection could not be established',
        'API key is required for private agents',
        {}
      );
    }

    return { apiKey };
  }

  /**
   * Get conversation token (WebRTC)
   */
  private async getConversationToken(
    client: ElevenLabsClient,
    queryOptions: QueryOptions
  ) {
    const { agent_id } = queryOptions;

    if (!agent_id) {
      throw new QueryError('Invalid input', 'agent_id is required', {});
    }

    if (!client.apiKey) {
      throw new QueryError(
        'Invalid operation',
        'API key is required for this operation',
        {}
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agent_id}`,
      {
        headers: {
          'xi-api-key': client.apiKey,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to fetch conversation token');
    }

    return response.json();
  }

  /**
   * Get signed URL (WebSocket)
   */
  private async getSignedUrl(
    client: ElevenLabsClient,
    queryOptions: QueryOptions
  ) {
    const { agent_id } = queryOptions;

    if (!agent_id) {
      throw new QueryError('Invalid input', 'agent_id is required', {});
    }

    if (!client.apiKey) {
      throw new QueryError(
        'Invalid operation',
        'API key is required for this operation',
        {}
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agent_id}`,
      {
        headers: {
          'xi-api-key': client.apiKey,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to fetch signed URL');
    }

    return response.json();
  }
}
