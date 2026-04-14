import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { VacancyCreateDto } from 'src/dto/vacancy/vacancy.create.dto';
import { VacancyFindDto } from 'src/dto/vacancy/vacancy.find.dto';
import { VacancyFindResponseDto } from 'src/dto/vacancy/vacancy.find.response.dto';
import { Vacancy } from 'src/entities/vacancy.entity';
import { ApiResponse } from 'src/helper/api-response';
import { VacanciesService } from 'src/services/vacancies.service';

@Controller('vacancy')
export class VacancyController {
  constructor(private vacanciesService: VacanciesService) {}

  @Post('create')
  async create(
    @Body() vacancyCreateDto: VacancyCreateDto,
  ): Promise<ApiResponse<Vacancy>> {
    try {
      const data = await this.vacanciesService.create(vacancyCreateDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Success create a vacancy',
        data,
      };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: err as string,
          data: null,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(
    @Query() query: VacancyFindDto,
  ): Promise<ApiResponse<VacancyFindResponseDto>> {
    try {
      const data = await this.vacanciesService.findAll(query);
      return {
        statusCode: HttpStatus.OK,
        message: 'Success create a vacancy',
        data,
      };
    } catch (err) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: err as string,
          data: null,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
