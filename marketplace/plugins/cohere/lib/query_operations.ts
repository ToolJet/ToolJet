import { CohereClientV2 } from 'cohere-ai';
import { QueryOptions } from './types';

export async function textGeneration(
  cohere: CohereClientV2, 
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, message, advanced_parameters } = options;

  if (!model || !message) {
    return { error: 'Model and message are required for text generation.', statusCode: 400 };
  }

  let advancedParams = {};
  if (advanced_parameters) {
      advancedParams = JSON.parse(advanced_parameters);
  }

    const response = await cohere.generate({
      model: model,
      prompt: message,
      ...advancedParams,
    });

    return response.generations[0].text;
}

export async function chat(
  cohere: CohereClientV2, 
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
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

    return response.message.content[0].text;
}