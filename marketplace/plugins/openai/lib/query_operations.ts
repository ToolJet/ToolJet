import OpenAI from 'openai'; // Updated SDK version
import { QueryOptions } from './types';

// All GPT image family models — always return b64_json, never a URL
const GPT_IMAGE_MODELS = new Set([
  'gpt-image-1',
  'gpt-image-1-mini',
  'gpt-image-1.5',
  'gpt-image-2',
  'gpt-image-2-2026-04-21',
]);

// gpt-image-2 supports arbitrary WIDTHxHEIGHT strings up to 3840x2160;
// the standard fixed-size switch used by the other GPT image models does not apply
const GPT_IMAGE_2_MODELS = new Set(['gpt-image-2', 'gpt-image-2-2026-04-21']);

const GPT_IMAGE_2_SIZE_RE = /^\d+x\d+$/;

const getSizeEnum = (model: string | undefined, size: string | undefined): string => {
  // gpt-image-2: pass through any valid WIDTHxHEIGHT string or 'auto'; default 1024x1024
  if (GPT_IMAGE_2_MODELS.has(model ?? '')) {
    const s = size?.trim() ?? '';
    if (s === 'auto' || GPT_IMAGE_2_SIZE_RE.test(s)) return s;
    return '1024x1024';
  }

  // Standard GPT image models: fixed size set + auto
  if (GPT_IMAGE_MODELS.has(model ?? '')) {
    switch (size) {
      case '1024x1024': return '1024x1024';
      case '1536x1024': return '1536x1024';
      case '1024x1536': return '1024x1536';
      case 'auto':      return 'auto';
      default:          return '1024x1024';
    }
  }

  if (model === 'dall-e-3') {
    switch (size) {
      case '1024x1024': return '1024x1024';
      case '1792x1024': return '1792x1024';
      case '1024x1792': return '1024x1792';
      default:          return '1024x1024';
    }
  }

  if (model === 'dall-e-2') {
    switch (size) {
      case '1024x1024': return '1024x1024';
      case '512x512':   return '512x512';
      case '256x256':   return '256x256';
      default:          return '1024x1024';
    }
  }

  return '1024x1024';
};

//Utility function to convert number of images from string or number
/*const getNumberOfImages = (num_images: number | string | undefined): number => {
  const num = typeof num_images === 'string' ? parseInt(num_images) : num_images;
  return isNaN(num) ? 1 : Math.max(1, Math.min(10, num)); // Ensure it's between 1 and 10
};*/

export async function getChatCompletion(
  openai: OpenAI,
  options: QueryOptions
): Promise<string | any> {
  const { model, prompt, message_history, system_prompt, max_tokens, temperature, stop_sequence } = options;

  const tokenLimit = typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens;
  const modelName = model?.toLowerCase() || '';

  // Identify "Existing" models that MUST use max_tokens
  const isExistingModel = 
    modelName.includes('gpt-4o') || 
    modelName.includes('gpt-4.0') || 
    modelName.includes('gpt-4-turbo') || 
    modelName.includes('gpt-3.5-turbo');

  let parsedMessages: any[] = [];

  if (system_prompt && typeof system_prompt === 'string' && system_prompt.trim() !== '') {
    parsedMessages.push({
      role: 'system',
      content: system_prompt
    });
  }

  if (message_history && message_history !== '') {
    try {
      const historyArray = typeof message_history === 'string' ? JSON.parse(message_history) : message_history;
      if (Array.isArray(historyArray)) {
        parsedMessages.push(...historyArray);
      }
    } catch (e) {
      console.error("Failed to parse message_history JSON", e);
      throw new Error('Invalid JSON provided for message history.');
    }
  }

  if (prompt && prompt !== '') {
     parsedMessages.push({ role: 'user', content: String(prompt) });
  }

  const requestPayload: any = {
    model: model || 'gpt-4o',
    messages: parsedMessages,
    stop: stop_sequence || null,
  };

  if (tokenLimit) {
    if (isExistingModel) {
      requestPayload.max_tokens = tokenLimit;
    } else {
      requestPayload.max_completion_tokens = tokenLimit;
    }
  }

  // 2. Temperature Guard: Reasoning models (o-series, gpt-5) do not support temperature.
  // GPT-4.1 (non-reasoning) DOES support it.
  const isReasoning = modelName.startsWith('o') || modelName.startsWith('gpt-5');
  if (!isReasoning) {
    requestPayload.temperature = typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0;
  }

  const response = await openai.chat.completions.create(requestPayload);
  return response.choices[0].message.content;
}

export async function generateImage(
  openai: OpenAI,
  options: QueryOptions
): Promise<{ status: string; message: string; description?: string; data?: any }> {
  const { model, prompt, size } = options;

  // Normalize model once
  const finalModel = model || 'dall-e-3';

  const response = await openai.images.generate({
    model: finalModel,
    prompt: (prompt as string) || '',
    size: getSizeEnum(finalModel, size),
  });

  // GPT image models always return b64_json — URLs are not supported
  if (GPT_IMAGE_MODELS.has(finalModel)) {
    return {
      status: 'success',
      message: 'Image generated successfully',
      data: {
        b64_json: response.data[0].b64_json,
      },
    };
  }

  // DALL-E models return a URL by default
  return {
    status: 'success',
    message: 'Image generated successfully',
    data: {
      url: response.data[0].url,
    },
  };
}

export async function generateEmbedding(openai: OpenAI, options: QueryOptions) {
  const rawOptions = options as any;
  const { model_embedding: model } = options;
  let input, encoding_format, dimensions;
  switch (model) {
    case 'text-embedding-3-small':
      input = rawOptions.input__m1 || options.input_M1;
      encoding_format = rawOptions.encoding_format__m1 || options.encoding_format_M1;
      dimensions = rawOptions.dimensions__m1 || options.dimensions_M1;
      break;
    case 'text-embedding-3-large':
      input = rawOptions.input__m2 || options.input_M2;
      encoding_format = rawOptions.encoding_format__m2 || options.encoding_format_M2;
      dimensions = rawOptions.dimensions__m2 || options.dimensions_M2;
      break;
    case 'text-embedding-ada-002':
      input = rawOptions.input__m3 || options.input_M3;
      encoding_format = rawOptions.encoding_format__m3 || options.encoding_format_M3;
      break;
  }

  const embedding = await openai.embeddings.create({
    model: model,
    input: input,
    encoding_format: encoding_format as any,
    ...(dimensions && { dimensions: Number(dimensions) }),
  });
  return embedding.data[0].embedding;
}