import { QueryOptions } from './types';
import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-opus-5';

const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  'claude-fable-5-1': 128000,
  'claude-fable-5': 128000,
  'claude-opus-5-5': 128000,
  'claude-opus-5': 128000,
  'claude-sonnet-5': 128000,
  'claude-haiku-4-5': 64000,
};

// Sampling parameters are rejected with a 400 on these models
const MODELS_WITHOUT_TEMPERATURE = new Set([
  'claude-fable-5-1',
  'claude-fable-5',
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-sonnet-5',
]);

const getMaxSize = (model: string, max_size: number | string | undefined): number => {
  const cap = MODEL_MAX_OUTPUT_TOKENS[model] ?? 2048;
  const size = typeof max_size === 'string' ? parseInt(max_size) : max_size;
  return isNaN(size) ? Math.min(256, cap) : Math.max(1, Math.min(cap, size));
};

const getTemperature = (temperature: number | string | undefined): number => {
  const temp = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
  return isNaN(temp) ? 0.5 : Math.max(0, Math.min(1, temp));
};

export async function getChatCompletion(
  anthropicClient: Anthropic,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { operation, model, system_prompt, message, history, prompt, temperature, max_size } = options;
  
  let messagesPayload: any[] = [];

  if (operation === 'chat') {
    messagesPayload = message ? JSON.parse(message) : [];
  } else if (operation === 'chat-v2') {
    let parsedHistory = [];
    if (history) {
      try {
        parsedHistory = JSON.parse(history);
      } catch (e) {
        parsedHistory = [];
      }
    }
    
    if (!prompt) {
      throw new Error("Prompt is required for chat operation");
    }

    messagesPayload = [
      ...parsedHistory,
      { role: 'user', content: prompt }
    ];
  }

  const selectedModel = model || DEFAULT_MODEL;

  const payload: any = {
    model: selectedModel,
    system: system_prompt || '',
    messages: messagesPayload,
    max_tokens: getMaxSize(selectedModel, max_size),
  };

  if (!MODELS_WITHOUT_TEMPERATURE.has(selectedModel)) {
    payload.temperature = getTemperature(temperature);
  }

  // streamed so that large max_tokens values do not hit the request timeout
  const response: any = await anthropicClient.messages.stream(payload).finalMessage();

  // models that reason by default emit an empty thinking block alongside the answer
  return response.content.filter((block: any) => block.type !== 'thinking'); //|| (response.choices && response.choices[0]?.text) || 'No output received';
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