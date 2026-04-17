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
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { USER_ROLES } from 'src/auth/role.constants';
import { Roles } from 'src/auth/roles.decorator';
import { ApplicationCreateDto } from 'src/dto/application/application.create.dto';
import { ApplicationFindDto } from 'src/dto/application/application.find.dto';
import { Application } from 'src/entities/application.entity';
import { ApplicationStatus } from 'src/enum/application-status.enum';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicationService } from 'src/services/application.service';

@Controller('application')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @Post('create')
  @Public()
  async create(@Body() applicationCreateDto: ApplicationCreateDto) {
    const data = await this.applicationService.create(applicationCreateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a application',
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
  async findAll(
    @Query() query: ApplicationFindDto,
  ): Promise<ApiResponse<FindResponseDto<Application>>> {
    const data = await this.applicationService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a vacancy',
      data,
    };
  }

  @Get(':id')
  @Roles(
    USER_ROLES.SUPERADMIN,
    USER_ROLES.HR,
    USER_ROLES.ADMIN,
    USER_ROLES.HIRING_MANAGER,
  )
  async findById(@Param('id') id: number) {
    try {
      return await this.applicationService.findById(id);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('change-status')
  @Roles(
    USER_ROLES.SUPERADMIN,
    USER_ROLES.HR,
    USER_ROLES.ADMIN,
    USER_ROLES.HIRING_MANAGER,
  )
  async changeStatus(
    @Query('id') id: number,
    @Query('status') status: ApplicationStatus,
  ) {
    try {
      return await this.applicationService.changeStatus(id, status);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }
}
