import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApplicationStatusAccess } from 'src/common/decorator/application-status-access.decorator';
import { Roles } from 'src/common/decorator/decorator';
import { ApplicationStatus, UserRole } from 'src/common/enum';
import { ApplicationStatusPolicyGuard } from 'src/common/guards/application-status-policy.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApplicationCreateDto } from 'src/dto/application/application.create.dto';
import { ApplicationFindDto } from 'src/dto/application/application.find.dto';
import { Application } from 'src/entities/application.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicationService } from 'src/services/application.service';

@Controller('application')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post('create')
  async create(@Body() applicationCreateDto: ApplicationCreateDto) {
    const data = await this.applicationService.create(applicationCreateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a application',
      data,
    };
  }

  @Get()
  async findAll(
    @Query() query: ApplicationFindDto,
  ): Promise<ApiResponse<FindResponseDto<Application>>> {
    const data = await this.applicationService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success load applications',
      data,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    try {
      return await this.applicationService.findById(id);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard, ApplicationStatusPolicyGuard, RolesGuard)
  @ApplicationStatusAccess({ allowSameStatus: false })
  @Roles(UserRole.HR, UserRole.INTERVIEWER, UserRole.SUPER_ADMIN)
  @Patch('change-status')
  async changeStatus(
    @Query('id') id: number,
    @Query('status') status: ApplicationStatus,
  ): Promise<ApiResponse<Application>> {
    const data = await this.applicationService.changeStatus(id, status);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success change application status',
      data: data,
    };
  }
}
