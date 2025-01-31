interface ApiEndpoint {
  endpoint: string;
}

interface CostConfig {
  input?: number;
  output?: number;
  searches?: number;
}

type ModelCostConfig = number | CostConfig;

export const apiMappings: Record<string, ApiEndpoint> = {
  fireworks: { endpoint: 'https://api.fireworks.ai/inference/v1' },
  openai: { endpoint: 'https://api.openai.com/v1' },
  perplexity: { endpoint: 'https://api.perplexity.ai' },
};

// per m token
export const costMappingWithoutCacheHit: Record<
  string,
  Record<string, ModelCostConfig>
> = {
  fireworks: {
    // apply to all input and output tokens
    'accounts/fireworks/models/deepseek-v3': 0.9,
    'accounts/fireworks/models/deepseek-r1': 8,
    'accounts/fireworks/models/llama-v3p1-8b-instruct': 0.2,
    'accounts/fireworks/models/llama-v3p1-405b-instruct': 3,
    'accounts/fireworks/models/llama-v3p3-70b-instruct': 0.9,
  },
  openai: {
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-2024-11-20': { input: 2.5, output: 5.0 },
    'gpt-4o-2024-05-13': { input: 2.5, output: 15.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4o-mini-2024-07-18': { input: 0.15, output: 0.6 },
  },
  perplexity: {
    // per 1000 searches from the result.citations
    'sonar-reasoning': { input: 1, output: 5, searches: 5 },
    'sonar-pro': { input: 3, output: 15, searches: 5 },
    sonar: { input: 1, output: 1, searches: 5 },
  },
};

export const costMappingWithCacheHit: Record<
  string,
  Record<string, ModelCostConfig>
> = {
  openai: {
    'gpt-4o': { input: 1.25 },
    'gpt-4o-2024-11-20': { input: 1.25 },
    'gpt-4o-mini': { input: 0.075 },
    'gpt-4o-mini-2024-07-18': { input: 0.075 },
  },
};
