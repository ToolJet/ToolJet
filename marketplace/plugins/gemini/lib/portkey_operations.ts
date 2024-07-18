import * as PortkeyAi from 'portkey-ai';
import { QueryOptions } from './types';

export async function getCompletion(
    portkey: PortkeyAi.Portkey,
    options: QueryOptions
): Promise<Object | { error: string; statusCode: number }> {
    const { prompt, max_tokens, temperature, stop_sequence, suffix } = options;

    try {
        const data = await portkey.completions.create({
            model: 'gemini-pro',
            prompt,
            temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
            max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
            stop: stop_sequence || null,
            suffix: suffix || null,
        });
        return data;
    } catch (error) {
        return {
            error: error?.message,
            statusCode: error?.response?.status,
        };
    }
}

export async function getChatCompletion(
    portkey: PortkeyAi.Portkey,
    options: QueryOptions
): Promise<Object | { error: string; statusCode: number }> {
    const { prompt, max_tokens, temperature, stop_sequence } = options;

    try {
        const data = await portkey.chat.completions.create({
            model: 'gemini-pro',
            temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 0,
            max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 67,
            stop: stop_sequence || null,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        return data;
    } catch (error) {
        return {
            error: error?.message,
            statusCode: error?.response?.status,
        };
    }
}