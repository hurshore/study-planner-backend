import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import { ResponseMessage } from './file-upload.constants';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = 'uploads';

  constructor() {
    this.ensureUploadDirectoryExists();
  }

  private async ensureUploadDirectoryExists() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException(ResponseMessage.NO_FILE);
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);
    return fileName;
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
