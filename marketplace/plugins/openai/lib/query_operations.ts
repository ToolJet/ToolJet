import OpenAI from 'openai';
import { QueryOptions } from './types';

export async function getCompletion(
  openai: OpenAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { prompt, max_tokens, temperature, stop_sequence, suffix } = options;

  try {
    const completion = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: prompt,
      temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
      max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
      stop: stop_sequence || undefined,
      suffix: suffix || undefined,
    });

    return completion.choices[0].text;
  } catch (error) {
    console.log('error openapi ===============', error);

    if (error instanceof OpenAI.APIError) {
      return {
        error: error.message,
        statusCode: error.status,
      };
    } else {
      return {
        error: 'An unknown error occurred',
        statusCode: 500,
      };
    }
  }
}

export async function getChatCompletion(
  openai: OpenAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { prompt, max_tokens, temperature, stop_sequence } = options;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
      max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
      stop: stop_sequence || undefined,
      messages: [
        {
          role: 'assistant',
          content: prompt,
        },
      ],
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return {
        error: error.message,
        statusCode: error.status,
      };
    } else {
      return {
        error: 'An unknown error occurred',
        statusCode: 500,
      };
    }
  }
}