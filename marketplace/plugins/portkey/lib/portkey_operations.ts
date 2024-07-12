import * as PortkeyAi from 'portkey-ai';
import { ChatCompletionQueryOptions, EmbeddingQueryOptions, PromptCompletionQueryOptions, TextCompletionQueryOptions } from './types';

export async function getCompletion(
    portkey: PortkeyAi.Portkey,
    options: TextCompletionQueryOptions
): Promise<Record<string, any> | { error: string; statusCode: number }> {
    const { model, prompt, max_tokens, temperature, stop_sequences, metadata } = options;

    try {
        const data = await portkey.completions.create({
            model: typeof model === 'string' ? model : 'davinci-002',
            prompt: prompt,
            temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 1,
            max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 256,
            stop_sequences: typeof stop_sequences === 'string' ? stop_sequences.split(',') : [],
            ...JSON.parse(typeof options.other_parameters === 'string' ? options.other_parameters : '{}'),
        }, JSON.parse(typeof options.metadata === 'string' ? options.metadata : '{}'));
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
): Promise<Record<string, any> | { error: string; statusCode: number }> {
    const { model, messages, max_tokens, temperature, stop_sequences } = options;
    console.log(messages);
    try {
        const data = await portkey.chat.completions.create({
            model: typeof model === 'string' ? model : 'gpt-3.5-turbo',
            temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature || 1,
            max_tokens: typeof max_tokens === 'string' ? parseInt(max_tokens) : max_tokens || 256,
            stop_sequences: typeof stop_sequences === 'string' ? stop_sequences.split(',') : [],
            messages: typeof messages === 'string' ? JSON.parse(messages) : messages,
            ...JSON.parse(typeof options.other_parameters === 'string' ? options.other_parameters : '{}'),
        }, JSON.parse(typeof options.metadata === 'string' ? options.metadata : '{}'));
        console.log(data.choices[0]['message']);
        return data;
    } catch (error) {
        return {
            error: error?.message,
            statusCode: error?.response?.status,
        };
    }
}

export async function getPromptCompletion(
    portkey: PortkeyAi.Portkey,
    options: PromptCompletionQueryOptions
): Promise<Record<string, any> | { error: string; statusCode: number }> {
    const { promptId, variables, parameters, metadata } = options;

    try {
        const data = await portkey.prompts.completions.create({
            promptID: promptId,
            variables: typeof variables === 'string' ? JSON.parse(variables) : variables || null,
            ...JSON.parse(typeof options.parameters === 'string' ? options.parameters : '{}'),
            ...JSON.parse(typeof options.metadata === 'string' ? options.metadata : '{}'),
        }, JSON.parse(typeof options.metadata === 'string' ? options.metadata : '{}'));
        return data;
    } catch (error) {
        return {
            error: error?.message,
            statusCode: error?.response?.status,
        };
    }
}

export async function createEmbedding(
    portkey: PortkeyAi.Portkey,
    options: EmbeddingQueryOptions
): Promise<Record<string, any> | { error: string; statusCode: number }> {
    const { input, model, metadata } = options;

    try {
        const data = await portkey.embeddings.create({
            model: model,
            input: input,
            ...JSON.parse(typeof options.metadata === 'string' ? options.metadata : '{}'),
        });
        return data;
    } catch (error) {
        return {
            error: error?.message,
            statusCode: error?.response?.status,
        };
    }
}