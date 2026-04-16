import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Param,
  Patch,
  Put,
} from '@nestjs/common';
import { ApplicantCreateDto } from 'src/dto/applicant.create.dto';
import { ApplicantService } from 'src/services/applicant.service';
import type { Applicant } from 'src/entities/applicant.entity';

@Controller('applicant')
export class ApplicantController {
  constructor(private applicantServie: ApplicantService) {}

  @Post('create')
  async create(@Body() applicantCreateDto: ApplicantCreateDto) {
    try {
      return await this.applicantServie.create(applicantCreateDto);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    return await this.applicantServie.findAll();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: ApplicantCreateDto,
  ): Promise<Applicant> {
    try {
      return await this.applicantServie.update(id, payload);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<Applicant> {
    try {
      return await this.applicantServie.changeStatus(id, status);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }
}
