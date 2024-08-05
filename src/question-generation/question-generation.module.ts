import { Module } from '@nestjs/common';
import { QuestionGenerationService } from './question-generation.service';
import { QuestionGenerationController } from './question-generation.controller';
import { FileUploadModule } from 'src/file-upload/file-upload.module';

@Module({
  imports: [FileUploadModule],
  providers: [QuestionGenerationService],
  controllers: [QuestionGenerationController],
  exports: [QuestionGenerationService],
})
export class QuestionGenerationModule {}
