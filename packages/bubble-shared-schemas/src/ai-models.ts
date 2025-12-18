import { z } from 'zod';

// Define available models with provider/name combinations
export const AvailableModels = z.enum([
  // OpenAI models
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/grok-4',
  'openai/gpt-5-thinking',
  'openai/gemini-2.5-pro-exp-03-25',
  'openai/gemini-2.5-flash-image',
  // Google Gemini models
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash-image-preview',
  'google/gemini-3-pro-preview',

  // Anthropic models
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-haiku-4-5',

  // OpenRouter models
  'openrouter/x-ai/grok-code-fast-1',
  'openrouter/z-ai/glm-4.6',
  'openrouter/minimax/minimax-m2',
  'openrouter/google/gemini-3-pro-preview',
  'openrouter/openai/gpt-5.1-codex-mini',
  'openrouter/x-ai/grok-4.1-fast',
  'openrouter/google/gemini-3-flash-preview',
  'openrouter/deepseek/deepseek-v3.2',
  'openrouter/kwaipilot/kat-coder-pro:free',
]);

export type AvailableModel = z.infer<typeof AvailableModels>;
