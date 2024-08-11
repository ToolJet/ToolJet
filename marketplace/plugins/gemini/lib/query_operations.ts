import * as PortkeyAi from 'portkey-ai';
import { ChatCompletionQueryOptions, QueryOptions, TextCompletionQueryOptions } from './types';
import { DEFAULT_CHAT_MODEL, DEFAULT_COMPLETION_MODEL } from './constants';

export async function getCompletion(
    portkey: PortkeyAi.Portkey,
    options: TextCompletionQueryOptions
): Promise<Object | { error: string; statusCode: number }> {
    const { model, prompt, max_tokens, temperature, stop_sequences } = options;
    const queryOptions = {
        model: typeof model === 'string' && model !== '' ? model : DEFAULT_COMPLETION_MODEL,
        prompt: prompt,
        temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 1,
        max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 256,
        stop_sequences: typeof stop_sequences === 'string' ? stop_sequences.split(',') : [],
    }
    try {
        const data = await portkey.completions.create(queryOptions);
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
    options: ChatCompletionQueryOptions
): Promise<Object | { error: string; statusCode: number }> {
    const { model, messages, max_tokens, temperature, stop_sequences } = options;
    try {
        const data = await portkey.chat.completions.create({
            model: typeof model === 'string' ? model : DEFAULT_CHAT_MODEL,
            temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 1,
            max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 256,
            stop_sequences: typeof stop_sequences === 'string' ? stop_sequences.split(',') : [],
            messages: typeof messages === 'string' ? JSON.parse(messages) : messages,
        });
        return data;
    } catch (error) {
        return {
            error: error?.message,
            statusCode: error?.response?.status,
        };
    }
}