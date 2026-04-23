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
import { ApplicantStatusUpdateDto } from 'src/dto/applicant/applicant-status.update.dto';
import { ApplicantFindDto } from 'src/dto/applicant/applicant.find.dto';
import { ApplicantUpdateDto } from 'src/dto/applicant/applicant.update.dto';
import { Applicant } from 'src/entities/applicant.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicantService } from 'src/services/applicant.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';

@Controller('applicant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicantController {
  constructor(private applicantServie: ApplicantService) {}

  @Put('update-account')
  async update(
    @Body() applicantUpdateDto: ApplicantUpdateDto,
    @CurrentUser() user: SafeUserDto,
  ) {
    const data = await this.applicantServie.updateAccount(
      applicantUpdateDto,
      user,
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
