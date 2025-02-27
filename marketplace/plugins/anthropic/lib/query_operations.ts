import { QueryOptions } from './types';
import Anthropic from '@anthropic-ai/sdk';

const getMaxSize = (max_size: number | string | undefined): number => {
  const size = typeof max_size === 'string' ? parseInt(max_size) : max_size;
  return isNaN(size) ? 256 : Math.max(1, Math.min(2048, size));
};

const getTemperature = (temperature: number | string | undefined): number => {
  const temp = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
  return isNaN(temp) ? 0.5 : Math.max(0, Math.min(1, temp));
};

export async function getChatCompletion(
  anthropicClient: Anthropic,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, system_prompt, message, temperature, max_size } = options;
  //try {
    const messages = JSON.parse(message)
    const response: any = await anthropicClient.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      system: system_prompt || '',
      messages: messages,
      max_tokens: getMaxSize(max_size),
      temperature: getTemperature(temperature),
    });

    return response.content; //|| (response.choices && response.choices[0]?.text) || 'No output received';
  } /*catch (error) {
    throw new Error(error?.message || 'An unexpected error occurred');
  }
}*/

/*export async function getVisionCompletion(
  anthropicClient: Anthropic,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, system_prompt, message, temperature, max_size } = options;

  try {
    const response = await anthropicClient.vision.create({
      model: model || 'claude-3-5-sonnet-20241022',
      prompt: system_prompt || '',
      messages: message || [],
      temperature: getTemperature(temperature),
      max_tokens: getMaxSize(max_size),
    });

    return response.completion; 
  } catch (error: any) {
    console.error('Error in Anthropic vision completion:', error);

    return {
      error: error?.message,
      statusCode: error?.response?.status,
    };
  }
}
*/