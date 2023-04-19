import { AnalyzeDocumentCommand, TextractClient } from '@aws-sdk/client-textract';

export const analyzeDocument = async (base64Data: string, client: TextractClient) => {
  const buffer = Buffer.from(JSON.stringify(base64Data), 'base64');

  const params = {
    Document: {
      Bytes: new Uint8Array(buffer),
    },
    FeatureTypes: ['TABLES', 'FORMS'],
  };

  const command = new AnalyzeDocumentCommand(params);

  const result = await client.send(command);

  return result;
};

export const analyzeS3Document = async (bucket: string, fileName: string, client: TextractClient) => {
  const params = {
    Document: {
      S3Object: {
        Bucket: bucket,
        Name: fileName,
      },
    },
    FeatureTypes: ['TABLES', 'FORMS'],
  };

  const command = new AnalyzeDocumentCommand(params);

  const result = await client.send(command);

  return result;
};
