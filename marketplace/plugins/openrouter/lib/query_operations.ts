import OpenAI from 'openai';
import { QueryOptions } from './types';

/** Numeric fields arrive as strings from the query editor; an empty box must stay unset rather than 0. */
const asNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const asBoolean = (value: boolean | string | undefined): boolean =>
  value === true || value === 'true' || value === '{{true}}';

const splitList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/** History can arrive as JSON text from a codehinter or as a real array from a binding. */
const parseHistory = (history: string | any[] | undefined): any[] => {
  if (Array.isArray(history)) return history;
  if (typeof history !== 'string' || !history.trim()) return [];
  try {
    const parsed = JSON.parse(history);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function buildMessages(options: QueryOptions): any[] {
  const messages: any[] = [];
  if (options.system_prompt?.trim()) {
    messages.push({ role: 'system', content: options.system_prompt });
  }
  messages.push(...parseHistory(options.message_history));
  if (options.prompt?.trim()) {
    messages.push({ role: 'user', content: options.prompt });
  }
  return messages;
}

/**
 * The request body, separated from the call so the routing options can be read and tested.
 *
 * Two fields here are OpenRouter's rather than OpenAI's, and they are the reason to use a router at
 * all: `models` names fallbacks to try when the first choice is down or rate limited, and
 * `provider.data_collection` refuses providers that train on the prompt, which is what makes this
 * usable for customers whose data cannot be used for training.
 */
export function buildChatPayload(options: QueryOptions): Record<string, unknown> {
  const fallbacks = splitList(options.fallback_models);
  const payload: Record<string, unknown> = {
    model: options.model,
    messages: buildMessages(options),
    max_tokens: asNumber(options.max_tokens),
    temperature: asNumber(options.temperature),
    top_p: asNumber(options.top_p),
  };

  const stop = splitList(options.stop_sequence);
  if (stop.length) payload.stop = stop;
  if (asBoolean(options.json_mode)) payload.response_format = { type: 'json_object' };
  // `model` stays alongside the routing list; both shapes work, and keeping it means the primary
  // choice is still explicit. Every id in the list must be a real model: OpenRouter rejects the whole
  // request with a 400 if any one of them is unknown, rather than skipping it (checked live, 2026-09-19).
  if (fallbacks.length) payload.models = [options.model, ...fallbacks].filter(Boolean);
  if (options.data_collection === 'deny') payload.provider = { data_collection: 'deny' };

  // Send only what the user set: an explicit null or 0 means something different to a provider than
  // "not specified", and models disagree about the defaults.
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

export async function getChatCompletion(client: OpenAI, options: QueryOptions): Promise<any> {
  const response: any = await client.chat.completions.create(buildChatPayload(options) as any);
  const choice = response?.choices?.[0];
  return {
    // The text first, because that is what a component binds to; everything else stays available.
    message: choice?.message?.content ?? '',
    finish_reason: choice?.finish_reason ?? null,
    // Which provider actually served this. With fallbacks configured the answer is not the model asked for.
    model: response?.model ?? options.model,
    provider: response?.provider ?? null,
    usage: response?.usage ?? null,
    id: response?.id ?? null,
  };
}

export async function generateEmbedding(client: OpenAI, options: QueryOptions): Promise<any> {
  const response: any = await client.embeddings.create({
    model: options.model,
    input: options.input ?? '',
    ...(options.encoding_format ? { encoding_format: options.encoding_format } : {}),
  } as any);
  return {
    embedding: response?.data?.[0]?.embedding ?? [],
    embeddings: (response?.data ?? []).map((entry: any) => entry.embedding),
    model: response?.model ?? options.model,
    usage: response?.usage ?? null,
  };
}

/**
 * The catalogue, so an app can offer models in a dropdown instead of hard-coding them. OpenRouter
 * carries hundreds and the list moves, which is why the model field is free text everywhere else.
 */
export async function listModels(client: OpenAI): Promise<any> {
  const response: any = await client.models.list();
  const models = (response?.data ?? []).map((model: any) => ({
    id: model.id,
    name: model.name ?? model.id,
    context_length: model.context_length ?? null,
    pricing: model.pricing ?? null,
  }));
  return { models, count: models.length };
}
