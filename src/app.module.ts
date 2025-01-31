import { Module } from '@nestjs/common';
import { OpenaiModule } from './openai/openai.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [OpenaiModule, SharedModule],
})
export class AppModule {}
