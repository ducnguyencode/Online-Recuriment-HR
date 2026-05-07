import { Injectable } from '@nestjs/common';
import { StatusGuard } from './status.guard';
import { Reflector } from '@nestjs/core';
import { Vacancy } from 'src/entities/vacancy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VacancyStatus } from 'src/common/enum';

@Injectable()
export class VacancyStatusGuard extends StatusGuard {
  constructor(
    reflector: Reflector,
    @InjectRepository(Vacancy) repo: Repository<Vacancy>,
  ) {
    super(
      reflector,
      repo,
      `Vacancy is ${VacancyStatus.CLOSED} or ${VacancyStatus.SUSPENDED}`,
    );
  }
}
