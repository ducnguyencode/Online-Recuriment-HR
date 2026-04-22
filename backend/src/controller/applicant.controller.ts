import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { USER_ROLES } from 'src/auth/role.constants';
import { ApplicantFindDto } from 'src/dto/applicant/applicant.find.dto';
import { ApplicantStatusUpdateDto } from 'src/dto/applicant/applicant-status.update.dto';
import { ApplicantUpdateDto } from 'src/dto/applicant/applicant.update.dto';
import { Applicant } from 'src/entities/applicant.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicantService } from 'src/services/applicant.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('applicant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicantController {
  constructor(private applicantServie: ApplicantService) {}

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
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.INTERVIEWER)
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
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.INTERVIEWER)
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
