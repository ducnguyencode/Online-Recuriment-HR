/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Applicant } from 'src/entities/applicant.entity';
import { Brackets, Repository } from 'typeorm';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicantFindDto } from 'src/dto/applicant/applicant.find.dto';
import { ApplicantUpdateDto } from 'src/dto/applicant/applicant.update.dto';
import { ApplicantStatus, UserRole } from 'src/common/enum';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
import { User } from 'src/entities/user.entity';
import { signToken } from 'src/helper/function.helper';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(Applicant) private applicantsTable: Repository<Applicant>,
    private jwtService: JwtService,
  ) {}

  async findAll(
    request: ApplicantFindDto,
  ): Promise<FindResponseDto<Applicant>> {
    const { page, limit, search, status } = request;

    // 🔹 Base filter (no heavy joins)
    const baseQb = this.applicantsTable
      .createQueryBuilder('applicant')
      .leftJoin('applicant.user', 'user')
      .where('user.role = :role', { role: UserRole.APPLICANT });

    if (search) {
      baseQb.andWhere(
        new Brackets((qb) => {
          qb.where('user.fullName ILIKE :search').orWhere(
            'user.email ILIKE :search',
          );
        }),
        { search: `%${search}%` },
      );
    }

    if (status) {
      baseQb.andWhere('applicant.status = :status', { status });
    }

    // 🔹 Subquery for pagination (ONLY ids)
    const subQuery = baseQb
      .clone()
      .select('applicant.id', 'id')
      .orderBy('applicant.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    // 🔹 Main query (DISTINCT ON + latest application)
    const qb = this.applicantsTable
      .createQueryBuilder('applicant')

      // keep 1 row per applicant
      .distinctOn(['applicant.id'])

      .innerJoin(
        '(' + subQuery.getQuery() + ')',
        'paged',
        'paged.id = applicant.id',
      )

      .leftJoinAndSelect('applicant.user', 'user')

      // latest application per applicant
      .leftJoinAndSelect(
        'applicant.applications',
        'application',
        `application.id = (
        SELECT a.id FROM applications a
        WHERE a."applicantId" = applicant.id
        ORDER BY a."createdAt" DESC
        LIMIT 1
      )`,
      )

      .leftJoinAndSelect('application.vacancy', 'vacancy')

      .orderBy('applicant.id')
      .addOrderBy('application.createdAt', 'DESC');

    qb.setParameters(baseQb.getParameters());

    const [items, total] = await Promise.all([qb.getMany(), baseQb.getCount()]);

    return {
      items,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
  }

  async changeStatus(id: number, status: ApplicantStatus) {
    const applicant = await this.applicantsTable.findOneBy({ id });

    if (!applicant) {
      throw new NotFoundException('Applicant not found');
    }

    applicant.status = status;

    return this.applicantsTable.save(applicant);
  }

  async updateAccount(data: ApplicantUpdateDto, safeUser: SafeUserDto) {
    if (
      data.email == safeUser.email &&
      data.fullName == safeUser.fullName &&
      data.phone == safeUser.phone
    ) {
      return null;
    }
    const user = await this.applicantsTable.manager.transaction(
      async (manager) => {
        const currentUser = await manager
          .createQueryBuilder(User, 'user')
          .setLock('pessimistic_write')
          .where('user.email = :email', { email: safeUser.email })
          .getOneOrFail();

        const exising = await manager
          .createQueryBuilder(User, 'user')
          .setLock('pessimistic_write')
          .where('user.email = :email', { email: data.email })
          .getOne();

        if (exising && exising.id != currentUser.id) {
          throw new ConflictException('Email already exist');
        }

        currentUser.email = data.email;
        currentUser.fullName = data.fullName;

        try {
          return await manager.save(currentUser);
        } catch (e: any) {
          if (e.code === '23505') {
            throw new ConflictException('Email already exist');
          }
          throw e;
        }
      },
    );
    return signToken(user, this.jwtService);
  }
}
