import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { FileUploadModule } from 'src/file-upload/file-upload.module';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [FileUploadModule, AIModule],
  providers: [QuestionService],
  controllers: [QuestionController],
  exports: [QuestionService],
})
export class QuestionModule {}
