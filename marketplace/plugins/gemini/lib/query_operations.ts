import { GoogleGenAI } from '@google/genai';
import { QueryOptions } from './types';

const getMaxTokens = (max_tokens: number | string | undefined): number => {
  const tokens = typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens;
  return isNaN(tokens) ? 1000 : Math.max(1, Math.min(4096, tokens));
};

const getTemperature = (temperature: number | string | undefined): number => {
  const temp = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
  return isNaN(temp) ? 0.1 : Math.max(0, Math.min(1, temp));
};

export async function generateText(
  geminiClient: GoogleGenAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, system_prompt, prompt, max_tokens, temperature } = options;

  if (!prompt) {
    return { error: 'Prompt is required for text generation.', statusCode: 400 };
  }

  const response = await geminiClient.models.generateContent({
    model: model || 'models/gemini-1.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    config: {
      systemInstruction: system_prompt,
      maxOutputTokens: getMaxTokens(max_tokens),
      temperature: getTemperature(temperature),
    },
  });

  return response.text || 'No output received';
}

export async function chat(
  geminiClient: GoogleGenAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, system_prompt, history, user_prompt, max_tokens, temperature } = options;

  if (!user_prompt) {
    return { error: 'User prompt is required for chat.', statusCode: 400 };
  }

  let histories = [];
  if (history) {
    histories = JSON.parse(history);
  }

  const chatSession = geminiClient.chats.create({
    model: model || 'models/gemini-1.5-flash',
    history: histories,
    config: {
      systemInstruction: system_prompt,
      maxOutputTokens: getMaxTokens(max_tokens),
      temperature: getTemperature(temperature),
    },
  });
  const response = await chatSession.sendMessage({ message: user_prompt });

  return response.text || 'No output received';
}
