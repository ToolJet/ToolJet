import { CohereClientV2 } from 'cohere-ai';
import { QueryOptions } from './types';

export async function textGeneration(cohere: CohereClientV2, options: QueryOptions) {
  const { model, message, advanced_parameters } = options;

  if (!model || !message) {
    return { error: 'Model and message are required for text generation.', statusCode: 400 };
  }

  let advancedParams = {};
  if (advanced_parameters) {
    advancedParams = JSON.parse(advanced_parameters);
  }

  const response = await cohere.chat({
    model: model,
    messages: [{ role: 'user', content: message }],
    ...advancedParams,
  });

  return response;
}

export async function chat(cohere: CohereClientV2, options: QueryOptions) {
  const { model, message, advanced_parameters, history } = options;

  if (!model || !history || !message) {
    throw new Error('Model, history, and message are required for chat.');
  }

  let parsedHistory = [];
  parsedHistory = JSON.parse(history);

  parsedHistory.push({
    role: 'user',
    content: message,
  });

  let advancedParams = {};
  if (advanced_parameters) {
    advancedParams = JSON.parse(advanced_parameters);
  }

  const response = await cohere.chat({
    model,
    messages: parsedHistory,
    ...advancedParams,
  });

  return response;
}

export async function embed(cohere: CohereClientV2, options: QueryOptions) {
  const { model, texts, input_type, advanced_parameters } = options;

  if (!model || !texts || !input_type) {
    throw new Error('Model, texts, and input type are required for embed.');
  }

  let advancedParams = {};
  if (advanced_parameters) {
    advancedParams = JSON.parse(advanced_parameters);
  }

  const response = await cohere.embed({
    model,
    texts: JSON.parse(texts),
    inputType: input_type,
    ...advancedParams,
  });

  return response;
}

export async function rerank(cohere: CohereClientV2, options: QueryOptions) {
  const { model, query, documents, advanced_parameters } = options;

  if (!model || !query || !documents) {
    throw new Error('Model, query, and documents are required for rerank.');
  }

  let advancedParams = {};
  if (advanced_parameters) {
    advancedParams = JSON.parse(advanced_parameters);
  }

  const response = await cohere.rerank({
    model,
    query,
    documents: JSON.parse(documents),
    ...advancedParams,
  });

  return response;
}
