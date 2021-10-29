import {
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
// https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function listBuckets(client: S3Client, options: object): Promise<object> {
  const command = new ListBucketsCommand(options);
  return client.send(command);
}

export async function listObjects(client: S3Client, options: object): Promise<object> {
  const command = new ListObjectsCommand({ Bucket: options['bucket'] });
  return client.send(command);
}

export async function signedUrlForGet(client: S3Client, options: object): Promise<object> {
  const command = new GetObjectCommand({
    Bucket: options['bucket'],
    Key: options['key'],
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: options['expiresIn'] || 3600,
  });
  return { url };
}

export async function signedUrlForPut(client: S3Client, options: object): Promise<object> {
  const command = new PutObjectCommand({
    Bucket: options['bucket'],
    Key: options['key'],
    ContentType: options['contentType'],
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: options['expiresIn'] || 3600,
  });
  return { url };
}
