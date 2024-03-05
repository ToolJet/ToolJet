import { Client as MinioClient } from 'minio';
import { Stream } from 'stream';

export async function listBuckets(minioClient: MinioClient, _queryOptions: object): Promise<object> {
  return await minioClient.listBuckets();
}

export async function listObjects(minioClient: MinioClient, queryOptions: object): Promise<object> {
  const stream = minioClient.listObjectsV2(
    queryOptions['bucket'],
    queryOptions['prefix'],
    true // recursive
  );
  const streamToData = (stream: Stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(chunks));
    });
  const bodyContents = await streamToData(stream);

  return { Body: bodyContents };
}

export async function signedUrlForGet(minioClient: MinioClient, queryOptions: object): Promise<object> {
  const defaultExpiry = +queryOptions['expiresIn'] || 86400;
  const url = await minioClient.presignedGetObject(queryOptions['bucket'], queryOptions['objectName'], defaultExpiry);

  return { url };
}

export async function getObject(minioClient: MinioClient, queryOptions: object): Promise<object> {
  const stream = await minioClient.getObject(queryOptions['bucket'], queryOptions['objectName']);
  const streamToString = (stream: Stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  const bodyContents = await streamToString(stream);

  return { Body: bodyContents };
}

export async function uploadObject(minioClient: MinioClient, queryOptions: object): Promise<object> {
  return await minioClient.putObject(
    queryOptions['bucket'],
    queryOptions['objectName'],
    queryOptions['data'],
    queryOptions['contentType'] && { contentType: queryOptions['contentType'] }
  );
}

export async function signedUrlForPut(minioClient: MinioClient, queryOptions: object): Promise<object> {
  const defaultExpiry = +queryOptions['expiresIn'] || 86400;
  const url = await minioClient.presignedPutObject(queryOptions['bucket'], queryOptions['objectName'], defaultExpiry);

  return { url };
}

export async function removeObject(minioClient: MinioClient, queryOptions: object): Promise<object> {
  await minioClient.removeObject(queryOptions['bucket'], queryOptions['objectName']);
  return {};
}
