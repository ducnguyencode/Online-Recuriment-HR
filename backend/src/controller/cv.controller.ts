/* eslint-disable @typescript-eslint/only-throw-error */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { USER_ROLES } from 'src/auth/role.constants';
import { Roles } from 'src/auth/roles.decorator';
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
  @Public()
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
  @Roles(
    USER_ROLES.SUPERADMIN,
    USER_ROLES.HR,
    USER_ROLES.ADMIN,
    USER_ROLES.HIRING_MANAGER,
  )
  async findAll() {
    const data = await this.cvService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a cv',
      data,
    };
  }
}
