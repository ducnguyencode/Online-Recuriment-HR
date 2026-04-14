import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApplicantCreateDto } from 'src/dto/applicant.create.dto';
import { ApplicantService } from 'src/services/applicant.service';

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
}
