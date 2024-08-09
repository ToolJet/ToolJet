import { AnalyzeDocumentCommand, TextractClient, FeatureType } from '@aws-sdk/client-textract';

export const analyzeDocument = async (base64Data: string, featureTypes: FeatureType[], client: TextractClient) => {
  const buffer = Buffer.from(base64Data, 'base64');

  const params = {
    Document: {
      Bytes: new Uint8Array(buffer),
    },
    FeatureTypes: featureTypes.length > 0 ? featureTypes : ['TABLES' as FeatureType],
  };

  const command = new AnalyzeDocumentCommand(params);

  const result = await client.send(command);

  return result;
};

export const analyzeS3Document = async (
  bucket: string,
  fileName: string,
  featureTypes: FeatureType[],
  client: TextractClient
) => {
  const params = {
    Document: {
      S3Object: {
        Bucket: bucket,
        Name: fileName,
      },
    },
    FeatureTypes: featureTypes.length > 0 ? featureTypes : ['TABLES' as FeatureType],
  };

  const command = new AnalyzeDocumentCommand(params);

  const result = await client.send(command);

  return result;
};