import { Test, TestingModule } from '@nestjs/testing';
import { OpenaiService } from './openai.service';
import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Observable } from 'rxjs';
import { CreateChatCompletionDto } from './dto/openai-dto';

jest.mock('openai');

describe('OpenaiService', () => {
  let service: OpenaiService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<OpenaiService>(OpenaiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChatCompletions', () => {
    const mockBearerToken = 'test-token';
    const mockType = 'openai';
    const mockCreateOpenaiDto: CreateChatCompletionDto = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
    };

    it('should handle non-streaming chat completions', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello there!',
              function_call: undefined,
              tool_calls: undefined,
            },
            index: 0,
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
          prompt_tokens_details: {
            cached_tokens: 0,
          },
        },
      } as const;

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      };

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () => mockOpenAI as unknown as OpenAI,
      );

      const result = await service.createChatCompletions(
        mockBearerToken,
        mockType,
        mockCreateOpenaiDto,
      );

      // Type guard to ensure we're dealing with non-stream response
      if (!(result instanceof Observable)) {
        expect(result.cost).toBeDefined();
        expect(result.choices).toEqual(mockResponse.choices);
      }
    });

    it('should handle streaming chat completions', async () => {
      const mockStreamResponse = {
        id: 'test-stream-id',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4o',
        choices: [
          {
            delta: { content: 'Hello' },
            index: 0,
            finish_reason: null,
            logprobs: null,
          },
        ],
      } as const;

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue([mockStreamResponse]),
          },
        },
      };

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () => mockOpenAI as unknown as OpenAI,
      );

      const streamingDto = { ...mockCreateOpenaiDto, stream: true };
      const result = await service.createChatCompletions(
        mockBearerToken,
        mockType,
        streamingDto,
      );

      expect(result).toBeInstanceOf(Observable);
    });

    it('should throw error for invalid API type', async () => {
      await expect(async () => {
        await service.createChatCompletions(
          mockBearerToken,
          'invalid-type',
          mockCreateOpenaiDto,
        );
      }).rejects.toThrow('API mapping for invalid-type not found');
    });
  });

  describe('cost calculation', () => {
    it('should calculate cost correctly for non-cached tokens', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'test response',
              function_call: undefined,
              tool_calls: undefined,
            },
            index: 0,
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          prompt_tokens_details: {
            cached_tokens: 0,
          },
        },
      } as const;

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      };

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () => mockOpenAI as unknown as OpenAI,
      );

      const result = await service.createChatCompletions(
        'test-token',
        'openai',
        { model: 'gpt-4o', messages: [{ role: 'user', content: 'test' }] },
      );

      // Type guard to ensure we're dealing with non-stream response
      if (!(result instanceof Observable)) {
        // Based on the cost mapping: input = 2.5, output = 10.0 per million tokens
        const expectedCost = (100 * 2.5 + 50 * 10.0) / 1_000_000; // Convert to per-token cost
        expect(result.cost).toBe(expectedCost);
      }
    });

    it('should calculate cost correctly with cached tokens', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'test response',
              function_call: undefined,
              tool_calls: undefined,
            },
            index: 0,
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          prompt_tokens_details: {
            cached_tokens: 30,
          },
        },
      } as const;

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      };

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () => mockOpenAI as unknown as OpenAI,
      );

      const result = await service.createChatCompletions(
        'test-token',
        'openai',
        { model: 'gpt-4o', messages: [{ role: 'user', content: 'test' }] },
      );

      // Type guard to ensure we're dealing with non-stream response
      if (!(result instanceof Observable)) {
        // 30 tokens at cache rate (1.25) + 70 tokens at normal rate (2.5) + 50 completion tokens (10.0)
        const expectedCost = (30 * 1.25 + 70 * 2.5 + 50 * 10.0) / 1_000_000;
        expect(result.cost).toBe(expectedCost);
      }
    });
  });
});
