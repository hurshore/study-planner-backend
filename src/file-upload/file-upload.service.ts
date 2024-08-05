import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import { ResponseMessage } from './file-upload.constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'src/common/transform.interceptor';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = 'uploads';

  constructor(private prisma: PrismaService) {
    this.ensureUploadDirectoryExists();
  }

  private async ensureUploadDirectoryExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: number,
  ): Promise<Response<{ courseId: number }>> {
    if (!file) {
      throw new BadRequestException(ResponseMessage.NO_FILE);
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    const course = await this.prisma.course.create({
      data: {
        title: file.originalname,
        fileName: fileName,
        userId,
      },
    });

    return {
      data: { courseId: course.id },
      message: ResponseMessage.UPLOAD_SUCCESS,
      success: true,
    };
  }

  async extractTextFromPdf(fileName: string): Promise<string> {
    const filePath = path.join(this.uploadDir, fileName);
    const dataBuffer = await fs.readFile(filePath);

    try {
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      throw new BadRequestException(ResponseMessage.EXTRACT_FAILED);
    }
  }
}
