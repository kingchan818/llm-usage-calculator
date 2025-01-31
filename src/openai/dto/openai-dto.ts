import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';

export interface CreateChatCompletionDto
  extends ChatCompletionCreateParamsBase {
  stream?: boolean;
}
