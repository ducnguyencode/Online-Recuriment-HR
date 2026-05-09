/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Applicant } from 'src/entities/applicant.entity';
import { Brackets, Repository } from 'typeorm';
import { FindResponseDto } from 'src/helper/find.response.dto';
import { ApplicantFindDto } from 'src/dto/applicant/applicant.find.dto';
import { ApplicantUpdateDto } from 'src/dto/applicant/applicant.update.dto';
import { ApplicantStatus, TokenType, UserRole } from 'src/common/enum';
import { SafeUserDto } from 'src/dto/user/safe.user.dto';
import { User } from 'src/entities/user.entity';
import { signToken } from 'src/helper/function.helper';
import { JwtService } from '@nestjs/jwt';
import { ApplicantChangePasswordDto } from 'src/dto/applicant/applicant.change-password.dto';
import * as bcrypt from 'bcrypt';
import { ApplicantCreateDto } from 'src/dto/applicant/applicant.create.dto';
import { UserService } from './user.service';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectRepository(Applicant) private applicantsTable: Repository<Applicant>,
    @InjectRepository(User) private usersTable: Repository<User>,
    private userService: UserService,
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
    if (
      applicant.status == ApplicantStatus.HIRED &&
      status != ApplicantStatus.HIRED
    ) {
      throw new BadRequestException(
        'Applicant already hired, cannot change status',
      );
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
        currentUser.phone = data.phone;

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

  async changePassword(
    data: ApplicantChangePasswordDto,
    safeUser: SafeUserDto,
  ) {
    if (data.newPassword != data.confirmPassword) {
      throw new BadRequestException('Confirm password miss match!');
    }
    const user = await this.applicantsTable.manager.transaction(
      async (manager) => {
        const existing = await manager.findOne(User, {
          where: { email: safeUser.email },
        });
        if (!existing) {
          throw new NotFoundException('Account not found!');
        }
        if (!bcrypt.compareSync(data.currentPassword, existing.password)) {
          throw new ForbiddenException('Incorrect current password!');
        }
        existing.password = await bcrypt.hash(data.newPassword, 10);
        return manager.save(existing);
      },
    );
    return user;
  }

  async createApplicant(
    actor: SafeUserDto,
    dto: ApplicantCreateDto,
  ): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const exists = await this.usersTable.findOne({
      where: { email },
      relations: ['applicant'],
    });
    if (exists) {
      if (exists.isVerified) {
        throw new ConflictException('Email already exists');
      }

      const tokenInfo = this.userService.getVerificationTokenInfo(
        exists.verificationToken,
      );
      if (tokenInfo && !tokenInfo.expired) {
        throw new ConflictException(
          'Already invited! Wait for applicant verify!',
        );
      }
      await this.userService.sendVerificationToApplicant(exists);
      return exists;
    }

    const saved = await this.usersTable.manager.transaction(async (manager) => {
      let user = manager.create(User, {
        email,
        fullName,
        phone: dto.phone?.trim() || undefined,
        role: UserRole.APPLICANT,
        password:
          '$2b$10$FfLdr1b6vkbWgJmnM9yY2u7EZw8iN88Q/xnE64DZPV4f7n6i5Ql6W',
        isVerified: false,
        isActive: false,
        mustChangePassword: true,
        verificationToken: null,
      });
      user = await manager.save(User, user);
      user.verificationToken = this.userService.generateEmailToken(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        null,
        UserRole.APPLICANT,
        '24h',
        TokenType.EMAIL_INVITE_VERIFY,
      );
      return await manager.save(User, user);
    });
    await this.userService.sendVerificationToApplicant(saved);
    return saved;
  }
}
