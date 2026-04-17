import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { USER_ROLES } from 'src/auth/role.constants';
import { Roles } from 'src/auth/roles.decorator';
import { VacancyCreateDto } from 'src/dto/vacancy/vacancy.create.dto';
import { VacancyFindDto } from 'src/dto/vacancy/vacancy.find.dto';
import { Vacancy } from 'src/entities/vacancy.entity';
import { ApiResponse } from 'src/helper/api-response';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { VacanciesService } from 'src/services/vacancies.service';

@Controller('vacancy')
export class VacancyController {
  constructor(private vacanciesService: VacanciesService) {}

  @Post('create')
  @Roles(USER_ROLES.SUPERADMIN, USER_ROLES.HR, USER_ROLES.ADMIN)
  async create(
    @Body() vacancyCreateDto: VacancyCreateDto,
  ): Promise<ApiResponse<Vacancy>> {
    const data = await this.vacanciesService.create(vacancyCreateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success create a vacancy',
      data,
    };
  }

  @Get()
  @Public()
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
}
