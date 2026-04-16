import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Applicant } from 'src/entities/applicant.entity';
import { ApplicantCreateDto } from 'src/dto/applicant/applicant.create.dto';
import { Brackets, Repository } from 'typeorm';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicantFindDto } from 'src/dto/applicant/applicant.find.dto';
import { ApplicantStatus } from 'src/enum/applicant-staus.enum';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(Applicant) private applicantsTable: Repository<Applicant>,
  ) {}

  async findAll(
    request: ApplicantFindDto,
  ): Promise<FindResponseDto<Applicant>> {
    const { page, limit, search, status } = request;

    const qb = this.applicantsTable.createQueryBuilder('applicant');

    //Filter
    if (search) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('applicant.fullName ILIKE :search')
            .orWhere('applicant.email ILIKE :search')
            .orWhere('applicant.code ILIKE :search');
        }),
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('applicant.status = :status', { status: status });
    }

    //Pagination
    qb.skip((page - 1) * limit).take(limit);

    //Order
    qb.orderBy('applicant.createdAt', 'DESC');

    const [applicants, totalApplicant] = await qb.getManyAndCount();

    return {
      items: applicants,
      totalItems: totalApplicant,
      totalPage: Math.ceil(totalApplicant / limit),
    };
  }

  create(data: ApplicantCreateDto) {
    return this.applicantsTable.manager.transaction(async (manager) => {
      const applicant = manager.create(Applicant, data);
      const newApplicant = await manager.save(applicant);

      newApplicant.code = `A${newApplicant.id.toString().padStart(4, '0')}`;
      return manager.save(newApplicant);
    });
  }

  async changeStatus(id: number, status: ApplicantStatus) {
    const applicant = await this.applicantsTable.findOneBy({ id });

    if (!applicant) {
      throw new NotFoundException('Applicant not found');
    }

    applicant.status = status;

    return this.applicantsTable.save(applicant);
  }
}
