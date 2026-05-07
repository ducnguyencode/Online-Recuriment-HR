import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvCreateDto } from 'src/dto/cv.create.dto';
import { CV } from 'src/entities/cv.entity';
import { ApiResponse } from 'src/helper/api-response';
import { CvService } from 'src/services/cv.service';

@Controller('cv')
export class CvController {
  constructor(private cvService: CvService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() cvCreateDto: CvCreateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.cvService.create(cvCreateDto, file);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a cv',
      data,
    };
  }

  @Get()
  async findAll() {
    const data = await this.cvService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a cv',
      data,
    };
  }

  @Get(':id')
  async findAllByApplicantId(
    @Param('id') id: number,
  ): Promise<ApiResponse<CV[]>> {
    const data = await this.cvService.findAllByApplicantId(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success get applicant cvs',
      data,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    const data = await this.cvService.delete(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success get applicant cvs',
      data,
    };
  }
}
