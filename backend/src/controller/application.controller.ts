import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApplicationCreateDto } from 'src/dto/application.create.dto';
import { ApplicationStatus } from 'src/enum/application-status.enum';
import { ApplicationService } from 'src/services/application.service';

@Controller('application')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post('create')
  async create(@Body() applicationCreateDto: ApplicationCreateDto) {
    try {
      return await this.applicationService.create(applicationCreateDto);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    return await this.applicationService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      return await this.applicationService.findById(id);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('change-status')
  async changeStatus(
    @Query('id') id: string,
    @Query('status') status: ApplicationStatus,
  ) {
    try {
      return await this.applicationService.changeStatus(id, status);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }
}
