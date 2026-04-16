import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApplicantStatusUpdateDto } from 'src/dto/applicant/applicant-status.update.dto';
import { ApplicantCreateDto } from 'src/dto/applicant/applicant.create.dto';
import { ApplicantFindDto } from 'src/dto/applicant/applicant.find.dto';
import { ApplicantUpdateDto } from 'src/dto/applicant/applicant.update.dto';
import { Applicant } from 'src/entities/applicant.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicantService } from 'src/services/applicant.service';

@Controller('applicant')
export class ApplicantController {
  constructor(private applicantServie: ApplicantService) {}

  @Post('create')
  async create(
    @Body() applicantCreateDto: ApplicantCreateDto,
  ): Promise<ApiResponse<Applicant>> {
    const data = await this.applicantServie.create(applicantCreateDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Success create an applicant',
      data,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() applicantUpdateDto: ApplicantUpdateDto,
  ): Promise<ApiResponse<Applicant>> {
    const data = await this.applicantServie.update(
      Number(id),
      applicantUpdateDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Success update an applicant',
      data,
    };
  }

  @Get()
  async findAll(
    @Query() query: ApplicantFindDto,
  ): Promise<ApiResponse<FindResponseDto<Applicant>>> {
    const data = await this.applicantServie.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a applicant',
      data,
    };
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() applicantStatusUpdateDto: ApplicantStatusUpdateDto,
  ) {
    const data = await this.applicantServie.changeStatus(
      Number(id),
      applicantStatusUpdateDto.status,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Success change applicant status',
      data,
    };
  }
}
