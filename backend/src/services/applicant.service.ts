import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Applicant } from 'src/entities/applicant.entity';
import { ApplicantCreateDto } from 'src/dto/applicant.create.dto';
import { Entity, Repository } from 'typeorm';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(Applicant) private applicantsTable: Repository<Applicant>,
  ) {}

  findAll(): Promise<Applicant[]> {
    return this.applicantsTable.find();
  }

  create(data: ApplicantCreateDto) {
    return this.applicantsTable.manager.transaction(async (manager) => {
      const applicant = manager.create(Entity, data);
      const newApplicant = (await manager.save(applicant)) as Applicant;

      newApplicant.code = `V${newApplicant.id.toString().padStart(4, '0')}`;
      return manager.save(newApplicant);
    });
  }
}
