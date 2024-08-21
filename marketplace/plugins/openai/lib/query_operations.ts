import { OpenAIApi } from 'openai';
import { QueryOptions } from './types';

export async function getCompletion(
  openai: OpenAIApi,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, prompt, max_tokens, temperature, stop_sequence, suffix } = options;

  try {
    const { data } = await openai.createCompletion({
      model: model || 'gpt-3.5-turbo-instruct', // Use the selected model or default to 'gpt-4.0'
      prompt: prompt,
      temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
      max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
      stop: stop_sequence || null,
      suffix: suffix || null,
    });

    return data.choices[0]['text'];
  } catch (error) {
    console.log('error openapi ===============', error);

    return {
      error: error?.message,
      statusCode: error?.response?.status,
    };
  }
}

export async function getChatCompletion(
  openai: OpenAIApi,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, prompt, max_tokens, temperature, stop_sequence } = options;

  try {
    const { data } = await openai.createChatCompletion({
      model: model || 'gpt-4-turbo', // Use the selected model or default to 'gpt-4-turbo'
      temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
      max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
      stop: stop_sequence || null,
      messages: [
        {
          role: 'user', // 'user' role is more appropriate here to initiate the conversation
          content: prompt,
        },
      ],
    });

    return data.choices[0]['message']['content'];
  } catch (error) {
    return {
      error: error?.message,
      statusCode: error?.response?.status,
    };
  }
}
