import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { CreateChatCompletionDto } from './dto/openai-dto';
import { map, tap, mergeMap } from 'rxjs/operators';
import { from } from 'rxjs';
import {
  apiMappings,
  costMappingWithoutCacheHit,
  costMappingWithCacheHit,
} from './cost-mapping';

function isCostConfig(
  config: any,
): config is { input: number; output: number } {
  return (
    typeof config === 'object' && ('input' in config || 'output' in config)
  );
}

const M_TOKEN = 1e6;

@Injectable()
export class OpenaiService {
  constructor(private readonly logger: Logger) {}

  async createChatCompletions(
    bearerToken: string,
    type: string,
    createOpenaiDto: CreateChatCompletionDto,
  ) {
    this.logger.log(`Creating chat completions for ${type}`);
    const api = this.getApiEndpoint(type);
    const openai = new OpenAI({ apiKey: bearerToken, baseURL: api.endpoint });

    if (createOpenaiDto.stream) {
      return this.handleStreamResponse(openai, type, createOpenaiDto);
    }

    return this.handleNonStreamResponse(openai, type, createOpenaiDto);
  }

  private getApiEndpoint(type: string) {
    const api = apiMappings[type];
    if (!api) {
      throw new Error(`API mapping for ${type} not found`);
    }
    return api;
  }

  private handleStreamResponse(
    openai: OpenAI,
    type: string,
    createOpenaiDto: CreateChatCompletionDto,
  ) {
    return from(
      openai.chat.completions.create({ ...createOpenaiDto, stream: true }),
    ).pipe(
      mergeMap((stream) => stream),
      tap((chunk: OpenAI.Chat.Completions.ChatCompletionChunk) => {
        const cost = this.calculateCost(type, createOpenaiDto.model, {
          prompt_tokens: chunk.usage?.prompt_tokens || 0,
          completion_tokens: chunk.usage?.completion_tokens || 0,
          cached_tokens: chunk.usage?.prompt_tokens_details?.cached_tokens || 0,
        });
        chunk['cost'] = cost;
      }),
      map((chunk) => {
        const data = JSON.stringify(chunk);
        return { data };
      }),
    );
  }

  private async handleNonStreamResponse(
    openai: OpenAI,
    type: string,
    createOpenaiDto: CreateChatCompletionDto,
  ) {
    const response = await openai.chat.completions.create({
      ...createOpenaiDto,
      stream: false,
    });

    const cost = this.calculateCost(type, createOpenaiDto.model, {
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      cached_tokens: response.usage?.prompt_tokens_details?.cached_tokens || 0,
    });

    return {
      ...response,
      cost,
    } as OpenAI.Chat.Completions.ChatCompletion & { cost: number };
  }

  private calculateCost(
    type: string,
    model: string | undefined,
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      cached_tokens?: number;
    },
  ): number {
    if (!model) return 0;

    const cachedTokens = usage.cached_tokens || 0;
    const costConfigWithoutCache = costMappingWithoutCacheHit[type]?.[model];
    const costConfigWithCache = costMappingWithCacheHit[type]?.[model];

    if (!costConfigWithoutCache) return 0;

    // Calculate effective prompt tokens after cache deduction
    const effectivePromptTokens = Math.max(
      usage.prompt_tokens - cachedTokens,
      0,
    );

    let cost = 0;

    // Handle cache hit pricing if available
    if (cachedTokens > 0 && costConfigWithCache) {
      if (typeof costConfigWithCache === 'object') {
        cost += (cachedTokens * (costConfigWithCache.input || 0)) / M_TOKEN;
      }
    }

    // Handle remaining tokens with normal pricing
    if (typeof costConfigWithoutCache === 'number') {
      cost +=
        ((effectivePromptTokens + usage.completion_tokens) *
          costConfigWithoutCache) /
        M_TOKEN;
    } else if (isCostConfig(costConfigWithoutCache)) {
      cost +=
        (effectivePromptTokens * (costConfigWithoutCache.input || 0) +
          usage.completion_tokens * (costConfigWithoutCache.output || 0)) /
        M_TOKEN;
    }

    return cost;
  }
}
