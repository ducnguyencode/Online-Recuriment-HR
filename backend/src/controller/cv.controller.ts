import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/public.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { USER_ROLES } from 'src/auth/role.constants';
import { CvCreateDto } from 'src/dto/cv.create.dto';
import { AiService } from 'src/services/ai.service';
import { CvService } from 'src/services/cv.service';

@Controller('cv')
export class CvController {
  constructor(
    private cvService: CvService,
    private aiService: AiService,
  ) {}

  @Public()
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
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.INTERVIEWER)
  async findAll() {
    const data = await this.cvService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a cv',
      data,
    };
  }
}
