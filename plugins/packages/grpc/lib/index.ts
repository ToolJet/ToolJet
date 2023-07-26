import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

export default class GRPC implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { serviceName, rpc, jsonMessage, metaDataOptions } = queryOptions;

    if (!sourceOptions.url) {
      throw new QueryError('Missing URL', {}, {});
    }

    const cwd = process.cwd();
    const rootDir = cwd.split('/').slice(0, -1).join('/');
    const protoFilePath = `${rootDir}/protos/service.proto`;

    const options: protoLoader.Options = {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    };

    const authType = sourceOptions.auth_type || 'none';

    const grpcObj: any = protoLoader.loadSync(protoFilePath, options);
    const Service: any = grpc.loadPackageDefinition(grpcObj)[serviceName];

    const clientStub: any = new Service(sourceOptions.url, grpc.credentials.createInsecure());

    const metadata = new grpc.Metadata();
    const message = JSON.parse(jsonMessage);
    const metaDataOptionsParsed = JSON.parse(metaDataOptions);

    if (metaDataOptionsParsed) {
      Object.keys(metaDataOptionsParsed).forEach((key) => {
        metadata.add(key, metaDataOptionsParsed[key]);
      });
    }

    if (authType === 'basic') {
      metadata.add('username', sourceOptions.username);
      metadata.add('password', sourceOptions.password);
    }

    if (authType === 'bearer') {
      metadata.add('Authorization', `Bearer ${sourceOptions.bearer_token}`);
    }

    if (authType === 'api_key') {
      metadata.add(sourceOptions.grpc_apikey_key, sourceOptions.grpc_apikey_value);
    }

    const result = await new Promise((resolve, reject) => {
      clientStub[rpc](message, metadata, (err: any, response: any) => {
        if (err) {
          reject(err);
        }
        resolve(response);
      });
    }).catch((err) => {
      throw new QueryError(err.message, {}, {});
    });

    return {
      status: 'ok',
      data: result as any,
    };
  }
}
