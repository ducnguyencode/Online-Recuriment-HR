import { Injectable } from '@nestjs/common';
import { OwnershipGuard } from './ownership.guard';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Vacancy } from 'src/entities/vacancy.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VacancyOwnershipGuard extends OwnershipGuard {
  constructor(
    reflector: Reflector,
    @InjectRepository(Vacancy) repo: Repository<Vacancy>,
  ) {
    super(reflector, repo, 'You are not own this vacancy');
  }
}
