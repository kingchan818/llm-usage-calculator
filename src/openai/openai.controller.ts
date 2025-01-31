import {
  Controller,
  Logger,
  Post,
  Body,
  Param,
  Req,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { OpenaiService } from './openai.service';
import { CreateChatCompletionDto } from './dto/openai-dto';
import { OpenaiInterceptor } from './openai.interceptor';
import { Response } from 'express';

interface RequestWithBearer extends Request {
  bearerToken?: string;
}

@Controller('')
@UseInterceptors(OpenaiInterceptor)
export class OpenaiController {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly logger: Logger,
  ) {}

  @Post('/:type/v1/chat/completions')
  async createChatCompletions(
    @Req() request: RequestWithBearer,
    @Param('type') type: string,
    @Body() createOpenaiDto: CreateChatCompletionDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(
      `Handling ${createOpenaiDto.stream ? 'streaming' : 'regular'} request`,
    );

    const result = await this.openaiService.createChatCompletions(
      request.bearerToken as string,
      type,
      createOpenaiDto,
    );

    if (createOpenaiDto.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      (result as Observable<{ data: string }>).subscribe({
        next: (data) => {
          res.write(`data: ${data.data}\n\n`);
        },
        complete: () => {
          res.end();
        },
        error: () => {
          res.status(500).end();
        },
      });
    } else {
      res.json(result);
    }
  }
}
