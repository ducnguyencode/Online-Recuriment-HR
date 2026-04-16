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

  async update(id: string, payload: ApplicantCreateDto) {
    const applicant = await this.applicantsTable.findOneOrFail({ where: { id } });

    applicant.fullName = payload.fullName;
    // email có thể null trong một số case; backend entity email có nullable=true
    if (payload.email !== undefined) applicant.email = payload.email;
    applicant.phone = payload.phone;

    return this.applicantsTable.save(applicant);
  }

  async changeStatus(id: string, status: string) {
    const applicant = await this.applicantsTable.findOneOrFail({ where: { id } });

    const mapped =
      status === 'In Process' || status === 'Not in Process' ? 'OpenToWork' :
      status === 'Hired' ? 'Hired' :
      status === 'Banned' ? 'Banned' :
      status;

    applicant.status = mapped;
    return this.applicantsTable.save(applicant);
  }
}
