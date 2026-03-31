import { countTokens as countTokensForGpt5 } from 'gpt-tokenizer/model/gpt-5';

export function estimateTokens(text: string): number {
  return countTokensForGpt5(text);
}
