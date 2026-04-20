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
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorator/decorator';
import { VacancyAccess } from 'src/common/decorator/vacancy-access.decorator';
import { UserRole, VacancyStatus } from 'src/common/enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
import { VacancyCreateDto } from 'src/dto/vacancy/vacancy.create.dto';
import { VacancyFindDto } from 'src/dto/vacancy/vacancy.find.dto';
import { VacancyUpdateDto } from 'src/dto/vacancy/vacancy.update.dto';
import { Vacancy } from 'src/entities/vacancy.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { VacanciesService } from 'src/services/vacancies.service';

@Controller('vacancy')
export class VacancyController {
  constructor(private vacanciesService: VacanciesService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: SafeUserDto,
    @Body() vacancyCreateDto: VacancyCreateDto,
  ): Promise<ApiResponse<Vacancy>> {
    const data = await this.vacanciesService.create(vacancyCreateDto, user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a vacancy',
      data,
    };
  }

  @Get()
  async findAll(
    @Query() query: VacancyFindDto,
  ): Promise<ApiResponse<FindResponseDto<Vacancy>>> {
    const data = await this.vacanciesService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a vacancy',
      data,
    };
  }

  @VacancyAccess({
    blockedStatuses: [VacancyStatus.CLOSED, VacancyStatus.SUSPENDED],
    ownershipField: 'createdById',
    roles: [UserRole.SUPER_ADMIN, UserRole.HR],
  })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() vacancyUpdateDto: VacancyUpdateDto,
  ) {
    const data = await this.vacanciesService.update(
      Number(id),
      vacancyUpdateDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Success update a vacancy',
      data,
    };
  }

  @VacancyAccess({
    blockedStatuses: [VacancyStatus.CLOSED, VacancyStatus.SUSPENDED],
    ownershipField: 'createdById',
    roles: [UserRole.SUPER_ADMIN, UserRole.HR],
  })
  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: VacancyStatus,
  ) {
    const data = await this.vacanciesService.changeStatus(Number(id), status);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success change a vacancy status',
      data,
    };
  }
}
