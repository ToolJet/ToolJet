import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import {
  getSummarizedContent,
  getTranslatedContent,
  getValidatedEmail,
  getParsedResume,
  getProofreadContent,
  getParaphrasedContent,
  getSeoTags,
  getDocumentExtraction,
} from './query_operations';

import { translateDocument, getWebpageText, getPdfText, getDocumentData } from './operations/data_extractions_operation';
export default class Apyhub implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    let result = {};
    try {
      switch (operation) {
        case Operation.ValidateEmail:
          result = await getValidatedEmail(queryOptions, sourceOptions);
          console.log(result);
          break;
        case Operation.SummarizeText:
          result = await getSummarizedContent(queryOptions, sourceOptions);
          console.log(result);
          break;
        case Operation.TranslateText:
          result = await getTranslatedContent(queryOptions, sourceOptions);
          break;
        case Operation.ParseResume:
          result = await getParsedResume(queryOptions, sourceOptions);
          break;
        case Operation.ProofreadText:
          result = await getProofreadContent(queryOptions, sourceOptions);
          break;
        case Operation.ParaphraseText:
          result = await getParaphrasedContent(queryOptions, sourceOptions);
          break;
        case Operation.GenerateSeoTags:
          result = await getSeoTags(queryOptions, sourceOptions);
          break;
        case Operation.OCRDocumentExtraction:
          result = await getDocumentExtraction(queryOptions, sourceOptions);
          break;
        case Operation.TranslateDocuments:
          result = await translateDocument(queryOptions, sourceOptions);
          break;
        case Operation.ExtractWebpageText:
          result = await getWebpageText(queryOptions, sourceOptions);
          break;
        case Operation.ExtractPDFText:
          result = await getPdfText(queryOptions, sourceOptions);
          break;
        case Operation.DocumentDataExtraction:
          result = await getDocumentData(queryOptions, sourceOptions);
          break;
        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<any> {
    const baseURL = 'https://api.apyhub.com';
    const apiToken = sourceOptions.apiKey;
    return {
      baseURL,
      apiToken
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const connection = await this.getConnection(sourceOptions);

    try {
      const response = await fetch(`${connection.baseURL}/data/info/country?country=in`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apy-token': connection.apiToken
        }
      });

      if (response.status !== 200) {
        throw new QueryError('Connection test failed', 'API returned non-200 status', {});
      }

      return {
        status: 'ok',
      };
    } catch (error) {
      throw new QueryError('Connection test failed', error.message, {});
    }
  }

}
