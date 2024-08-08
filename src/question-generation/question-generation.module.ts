import { Module } from '@nestjs/common';
import { QuestionGenerationService } from './question-generation.service';
import { QuestionGenerationController } from './question-generation.controller';
import { FileUploadModule } from 'src/file-upload/file-upload.module';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [FileUploadModule, AIModule],
  providers: [QuestionGenerationService],
  controllers: [QuestionGenerationController],
  exports: [QuestionGenerationService],
})
export class QuestionGenerationModule {}
