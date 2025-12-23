import {
  GetObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
  CreateBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
// https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { QueryOptions } from './types';

export async function listBuckets(client: S3Client, options: QueryOptions): Promise<object> {
  const command = new ListBucketsCommand(options);
  return client.send(command);
}

export async function listObjects(client: S3Client, options: object): Promise<object> {
  const command = new ListObjectsV2Command({
    Bucket: options['bucket'],
    Prefix: options['prefix'],
    MaxKeys: options['maxKeys'],
    StartAfter: options['offset'],
    ContinuationToken: options['continuationToken'],
  });

  return client.send(command);
}

export async function signedUrlForGet(client: S3Client, options: QueryOptions): Promise<object> {
  const command = new GetObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: options.expiresIn || 3600,
  });
  return { url };
}
export async function createBucket(client: S3Client, options: QueryOptions): Promise<object> {
  const createBucketCommand = new CreateBucketCommand({
    Bucket: options.bucket,
  });
  return await client.send(createBucketCommand);
}
export async function getObject(client: S3Client, options: QueryOptions): Promise<object> {
  // Create a helper function to convert a ReadableStream to a string.
  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });

  // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
  const command = new GetObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
  });
  const data = await client.send(command);
  // Convert the ReadableStream to a string.
  const bodyContents = await streamToString(data.Body);
  return { ...data, Body: bodyContents };
}

export async function uploadObject(client: S3Client, options: QueryOptions): Promise<object> {
  const encoding = options.encoding || 'utf8';
  const uploadData = (data: any, contentType: string) => {
    if (!data) {
      return;
    }
    return typeof data === 'object' && contentType.includes('application/json') ? JSON.stringify(data) : data;
  };
  const body = new Buffer(uploadData(options.data, options.contentType), encoding);
  const command = new PutObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
    Body: body,
    ContentType: options.contentType,
    ContentEncoding: encoding,
  });
  return await client.send(command);
}

export async function signedUrlForPut(client: S3Client, options: QueryOptions): Promise<object> {
  const command = new PutObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
    ContentType: options.contentType,
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: options.expiresIn || 3600,
  });
  return { url };
}

export async function removeObject(client: S3Client, options: QueryOptions): Promise<object> {
  const command = new DeleteObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
  });
  return await client.send(command);
}
