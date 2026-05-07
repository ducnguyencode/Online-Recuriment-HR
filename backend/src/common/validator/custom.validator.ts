import { NotFoundException } from '@nestjs/common';
import { Applicant } from 'src/entities/applicant.entity';
import { CV } from 'src/entities/cv.entity';
import { Vacancy } from 'src/entities/vacancy.entity';
import { EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
export class CustomValidator {
  async cvOwnershipValidator(
    manager: EntityManager,
    cvId: number,
    applicantId: number,
  ) {
    const exist = await manager.exists(CV, {
      where: { id: cvId, applicantId },
    });
    if (!exist) {
      throw new NotFoundException(
        'Can not find the given CV of the given applicant',
      );
    }
  }

  async checkApplicantExist(manager: EntityManager, applicantId: number) {
    const exist = await manager.exists(Applicant, {
      where: { id: applicantId },
    });

    if (!exist) {
      throw new NotFoundException('Applicant not found');
    }
  }

  async checkVacancyExist(manager: EntityManager, vacancyId: number) {
    const exist = await manager.exists(Vacancy, {
      where: { id: vacancyId },
    });

    if (!exist) {
      throw new NotFoundException('Vacancy not found');
    }
  }

  async checkCvExist(manager: EntityManager, cvId: number) {
    const exist = await manager.exists(CV, {
      where: { id: cvId },
    });

    if (!exist) {
      throw new NotFoundException('CV not found');
    }
  }

  async getOneOrFail<T extends ObjectLiteral>(
    manager: EntityManager,
    entity: EntityTarget<T>,
    where: Partial<T>,
    name = 'Entity',
  ) {
    const record = await manager.findOne(entity, { where });

    if (!record) {
      throw new NotFoundException(`${name} not found`);
    }

    return record;
  }
}
