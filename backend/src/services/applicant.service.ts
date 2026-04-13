import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Applicant } from 'src/entities/applicant.entity';
import { ApplicantCreateDto } from 'src/dto/applicant.create.dto';
import { Repository } from 'typeorm';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(Applicant) private applicantsTable: Repository<Applicant>,
  ) {}

  findAll(): Promise<Applicant[]> {
    return this.applicantsTable.find();
  }

  create(data: ApplicantCreateDto) {
    const applicant = this.applicantsTable.create(data);
    return this.applicantsTable.save(applicant);
  }
}
