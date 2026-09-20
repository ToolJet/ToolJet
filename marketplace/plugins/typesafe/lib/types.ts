export type AuthType = 'typesafe' | 'openrouter';

export type SourceOptions = {
  auth_type?: AuthType;
  /** Optional endpoint override; blank means the default for the chosen auth_type. */
  base_url?: string;
  /** TypeSafe API key (auth_type typesafe). */
  api_key?: string;
  /** OpenRouter API key (auth_type openrouter). */
  openrouter_api_key?: string;
};

export type QueryOptions = {
  operation: Operation;
  /** Text, or a JSON string / object / array, to decide about. */
  state?: string | Record<string, unknown> | unknown[];
  /** JSON map (or its string form) of question id to a typed question. */
  questions?: string | Record<string, Question>;
  model?: string;
};

export enum Operation {
  Evaluate = 'evaluate',
}

export type QuestionType = 'choice' | 'score' | 'noul';

export interface Question {
  type: QuestionType;
  instructions: string | Record<string, unknown> | unknown[];
  /** choice: map option -> description | null. score: ordered level list. noul: optional {true, false}. */
  criteria?: Record<string, string | null> | string[] | { true?: string; false?: string };
}

export interface EvaluateRequest {
  state: string | Record<string, unknown> | unknown[];
  model: string;
  questions: Record<string, Question>;
}

export interface EvaluateResponse {
  model: string;
  answers: Record<string, Answer>;
  usage?: { input_tokens?: number; output_tokens?: number; cost?: number };
}

export type Answer =
  | { type: 'noul'; noul: number }
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
  | { type: 'score'; score: number; legend: Record<string, string>; probabilities: Record<string, number>; confidence: number };
