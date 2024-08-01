import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { ResponseMessage } from './file-upload.constants';

@ApiTags('File Upload')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @ApiOperation({ summary: 'Upload PDF file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'PDF file successfully uploaded and text extracted',
    schema: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          description: 'Name of the uploaded file',
        },
        extractedText: {
          type: 'string',
          description: 'Text extracted from the PDF',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'No file uploaded or invalid file format',
  })
  @Post('pdf')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(ResponseMessage.NO_FILE);
    }

    const fileName = await this.fileUploadService.uploadFile(file);
    const extractedText =
      await this.fileUploadService.extractTextFromPdf(fileName);

    return { fileName, extractedText };
  }
}
