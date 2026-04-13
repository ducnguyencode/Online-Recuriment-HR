/* eslint-disable @typescript-eslint/only-throw-error */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvCreateDto } from 'src/dto/cv.create.dto';
import { AiService } from 'src/services/ai.service';
import { CvService } from 'src/services/cv.service';

@Controller('cv')
export class CvController {
  constructor(
    private cvService: CvService,
    private aiService: AiService,
  ) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() cvCreateDto: CvCreateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      return await this.cvService.create(cvCreateDto, file);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    return await this.cvService.findAll();
  }

  // @Post('test')
  // @UseInterceptors(FileInterceptor('file'))
  // async test(
  //   @Body('id') applicationId: string,
  //   @UploadedFile()
  //   file: Express.Multer.File,
  // ) {
  //   try {
  //     return await this.aiService.pdfToJson(file, applicationId);
  //   } catch (err) {
  //     console.log(err);
  //     throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
  //   }
  // }
}
