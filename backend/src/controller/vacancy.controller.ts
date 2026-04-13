import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { VacancyCreateDto } from 'src/dto/vacancy.create.dto';
import { VacanciesService } from 'src/services/vacancies.service';

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
}
