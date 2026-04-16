import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Patch,
  Put,
} from '@nestjs/common';
import { VacancyCreateDto } from 'src/dto/vacancy.create.dto';
import { VacanciesService } from 'src/services/vacancies.service';
import type { Vacancy } from 'src/entities/vacancy.entity';

@Controller('vacancy')
export class VacancyController {
  constructor(private vacanciesService: VacanciesService) {}

  @Post('create')
  async create(@Body() vacancyCreateDto: VacancyCreateDto) {
    try {
      return await this.vacanciesService.create(vacancyCreateDto);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.vacanciesService.findAll();
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: VacancyCreateDto) {
    try {
      return await this.vacanciesService.update(id, payload);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<Vacancy> {
    try {
      return await this.vacanciesService.changeStatus(id, status);
    } catch (err) {
      throw new HttpException(err as string, HttpStatus.BAD_REQUEST);
    }
  }
}
