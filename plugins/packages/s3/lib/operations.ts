import {
  GetObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
  CreateBucketCommand,
  ListObjectsV2Command,
  GetObjectCommandInput,
  PutObjectCommandInput,
  DeleteObjectCommandInput,
  CreateBucketCommandInput,
  ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { QueryOptions } from './types';
import { Readable } from 'stream';

export async function listBuckets(client: S3Client, options: QueryOptions | object): Promise<object> {
  const command = new ListBucketsCommand({});
  return client.send(command);
}

export async function listObjects(client: S3Client, options: QueryOptions | any): Promise<object> {
  const params: ListObjectsV2CommandInput = {
    Bucket: options['bucket'],
    Prefix: options['prefix'],
    MaxKeys: options['maxKeys'],
    StartAfter: options['offset'],
    ContinuationToken: options['continuationToken'],
  };

  const command = new ListObjectsV2Command(params);
  return client.send(command);
}

export async function signedUrlForGet(client: S3Client, options: QueryOptions): Promise<object> {
  const params: GetObjectCommandInput = {
    Bucket: options.bucket,
    Key: options.key,
  };

  const command = new GetObjectCommand(params);
  const url = await getSignedUrl(client, command, {
    expiresIn: options.expiresIn || 3600,
  });
  return { url };
}

export async function createBucket(client: S3Client, options: QueryOptions): Promise<object> {
  const params: CreateBucketCommandInput = {
    Bucket: options.bucket,
  };

  const command = new CreateBucketCommand(params);
  return await client.send(command);
}

export async function getObject(client: S3Client, options: QueryOptions): Promise<object> {
  // Helper function to convert a ReadableStream to a string
  const streamToString = (stream: Readable): Promise<string> =>
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });

  const params: GetObjectCommandInput = {
    Bucket: options.bucket,
    Key: options.key,
  };

  const command = new GetObjectCommand(params);
  const data = await client.send(command);

  // Convert the ReadableStream to a string
  const bodyContents = await streamToString(data.Body as Readable);
  return { ...data, Body: bodyContents };
}

export async function uploadObject(client: S3Client, options: QueryOptions): Promise<object> {
  const encoding = (options.encoding || 'utf8') as BufferEncoding;

  const uploadData = (data: any, contentType: string) => {
    if (!data) {
      return '';
    }
    return typeof data === 'object' && contentType.includes('application/json') ? JSON.stringify(data) : data;
  };

  const body = Buffer.from(uploadData(options.data, options.contentType), encoding);

  const params: PutObjectCommandInput = {
    Bucket: options.bucket,
    Key: options.key,
    Body: body,
    ContentType: options.contentType,
    ContentEncoding: encoding,
  };

  const command = new PutObjectCommand(params);
  return await client.send(command);
}

export async function signedUrlForPut(client: S3Client, options: QueryOptions): Promise<object> {
  const params: PutObjectCommandInput = {
    Bucket: options.bucket,
    Key: options.key,
    ContentType: options.contentType,
  };

  const command = new PutObjectCommand(params);
  const url = await getSignedUrl(client, command, {
    expiresIn: options.expiresIn || 3600,
  });
  return { url };
}

export async function removeObject(client: S3Client, options: QueryOptions): Promise<object> {
  const params: DeleteObjectCommandInput = {
    Bucket: options.bucket,
    Key: options.key,
  };

  const command = new DeleteObjectCommand(params);
  return await client.send(command);
}
