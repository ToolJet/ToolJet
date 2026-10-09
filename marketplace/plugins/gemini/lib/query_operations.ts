import { GoogleGenerativeAI } from '@google/generative-ai';
import { QueryOptions } from './types';

const DEFAULT_MODEL = 'models/gemini-3.8-flash';

const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  'models/gemini-3.8-flash': 65536,
  'models/gemini-3.7-flash': 65536,
  'models/gemini-3.6-flash': 65536,
  'models/gemini-3.5-flash': 65536,
  'models/gemini-3.5-flash-lite': 65536,
  'models/gemini-3.1-pro-preview': 65536,
  'models/gemini-3.1-flash-lite': 65536,
  'models/gemini-3-pro-preview': 65536,
  'models/gemini-3-flash-preview': 65536,
  'models/gemini-2.5-pro': 65536,
  'models/gemini-2.5-flash': 65536,
  'models/gemini-2.5-flash-lite': 65536,
};

// reasoning models spend part of the budget on thinking before any text is produced,
// so they need more headroom than the 1000 tokens older models default to
const getMaxTokens = (model: string, max_tokens: number | string | undefined): number => {
  const cap = MODEL_MAX_OUTPUT_TOKENS[model] ?? 4096;
  const fallback = cap > 4096 ? 8192 : 1000;
  const tokens = typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens;
  return isNaN(tokens) ? Math.min(fallback, cap) : Math.max(1, Math.min(cap, tokens));
};

const getTemperature = (temperature: number | string | undefined): number => {
  const temp = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
  return isNaN(temp) ? 0.1 : Math.max(0, Math.min(1, temp));
};

export async function generateText(
  geminiClient: GoogleGenerativeAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, system_prompt, prompt, max_tokens, temperature } = options;

  if (!prompt) {
    return { error: 'Prompt is required for text generation.', statusCode: 400 };
  }

  const selectedModel = model || DEFAULT_MODEL;

  const generativeModel = geminiClient.getGenerativeModel({
    model: selectedModel,
    systemInstruction: system_prompt,
  });

  //try {
    const response = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: getMaxTokens(selectedModel, max_tokens),
        temperature: getTemperature(temperature),
      },
    });

    return response.response.text() || 'No output received';
  } //catch (error) {
    //throw new Error(error?.message || 'An unexpected error occurred');
  //}
//}

export async function chat(
  geminiClient: GoogleGenerativeAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, system_prompt, history, user_prompt, max_tokens, temperature } = options;

  if (!user_prompt) {
    return { error: 'User prompt is required for chat.', statusCode: 400 };
  }

  const selectedModel = model || DEFAULT_MODEL;

  const generativeModel = geminiClient.getGenerativeModel({
    model: selectedModel,
    systemInstruction: system_prompt,
  });

  //try {
    let histories = [];
    if (history) {
      histories = JSON.parse(history);
    }
    const chat = await generativeModel.startChat({ 
      history: histories,
      generationConfig: {
        maxOutputTokens: getMaxTokens(selectedModel, max_tokens),
        temperature: getTemperature(temperature),
      },
     });
    const response = await chat.sendMessage(user_prompt);

    return response.response.text() || 'No output received';
  } //catch (error) {
    //throw new Error(error?.message || 'An unexpected error occurred');
  //}
//}