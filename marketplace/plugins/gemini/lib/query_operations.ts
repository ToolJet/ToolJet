import { GoogleGenerativeAI } from '@google/generative-ai';
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
  geminiClient: GoogleGenerativeAI,
  options: QueryOptions
): Promise<string | { error: string; statusCode: number }> {
  const { model, system_prompt, prompt, max_tokens, temperature } = options;

  if (!prompt) {
    return { error: 'Prompt is required for text generation.', statusCode: 400 };
  }

  const generativeModel = geminiClient.getGenerativeModel({
    model: model || 'models/gemini-1.5-flash',
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
        maxOutputTokens: getMaxTokens(max_tokens),
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

  const generativeModel = geminiClient.getGenerativeModel({
    model: model || 'models/gemini-1.5-flash',
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
        maxOutputTokens: getMaxTokens(max_tokens),
        temperature: getTemperature(temperature),
      },
     });
    const response = await chat.sendMessage(user_prompt);

    return response.response.text() || 'No output received';
  } //catch (error) {
    //throw new Error(error?.message || 'An unexpected error occurred');
  //}
//}