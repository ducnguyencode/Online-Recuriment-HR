import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import path from 'path';
import { CvCreateDto } from 'src/dto/cv.create.dto';
import { CV } from 'src/entities/cv.entity';
import { Repository } from 'typeorm';
import fs from 'fs';
import { Application } from 'src/entities/application.entity';

@Injectable()
export class CvService {
  constructor(@InjectRepository(CV) private cvsTable: Repository<CV>) {}

  findAll(): Promise<CV[]> {
    return this.cvsTable.find();
  }

  findAllByApplicantId(applicantId: number): Promise<CV[]> {
    return this.cvsTable.find({ where: { applicantId } });
  }

  async create(data: CvCreateDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Invalid file');
    }
    if (file.mimetype != 'application/pdf') {
      throw new BadRequestException('Only accept pdf');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size too large');
    }

    return this.cvsTable.manager.transaction(async (manager) => {
      if (
        (await manager.count(CV, {
          where: { applicantId: data.applicantId },
        })) >= 5
      ) {
        throw new ForbiddenException(
          'You can only upload a maximum of 5 Resumes.',
        );
      }
      let cv = manager.create(CV, {
        ...data,
        applicant: { id: data.applicantId },
      });
      cv = await manager.save(cv);

      // get file name
      // const fileName = `${cv.code}.pdf`;
      const fileName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
      const filePath = `cv/applicant-${cv.applicantId}`;
      const uploadDir = path.join(process.cwd(), `uploads/${filePath}`);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save file
      const saveFilePath = path.join(uploadDir, fileName);
      try {
        fs.writeFileSync(saveFilePath, file.buffer, { flag: 'wx' });
      } catch (err: any) {
        if (err.code === 'EEXIST') {
          throw new BadRequestException('File already exists');
        }
        throw err;
      }

      cv.fileUrl = `${filePath}/${fileName}`;
      cv.fileName = fileName;
      return manager.save(cv);
    });
  }

  async delete(id: number) {
    await this.cvsTable.manager.transaction(async (manager) => {
      const existing = await manager.findOne(CV, {
        where: { id },
        relations: ['applications'],
      });

      if (!existing) {
        throw new NotFoundException('CV not found');
      }

      const filePath = path.join(process.cwd(), 'uploads', existing.fileUrl);

      // Preserve immutable copies for submitted applications before removing
      // the profile CV. HR must still be able to review what was submitted.
      if (existing.applications?.length) {
        for (const application of existing.applications) {
          if (!application.submittedCvFileUrl) {
            await this.createSubmittedCvSnapshot(existing, application);
          }
        }

        await manager.save(Application, existing.applications);
      }

      // delete CV
      await manager.delete(CV, { id });

      // delete file
      try {
        await fs.promises.unlink(filePath);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          console.error('Fail to delete file:', err);
        }
      }
    });

    return 'Delete success';
  }

  private async createSubmittedCvSnapshot(cv: CV, application: Application) {
    if (!cv.fileUrl) {
      throw new BadRequestException('CV file not found');
    }

    const sourcePath = path.join(process.cwd(), 'uploads', cv.fileUrl);
    const safeFileName = path.basename(cv.fileName || cv.fileUrl);
    const snapshotPath = `application-cvs/application-${application.id}`;
    const uploadDir = path.join(process.cwd(), 'uploads', snapshotPath);
    const targetPath = path.join(uploadDir, safeFileName);

    try {
      await fs.promises.mkdir(uploadDir, { recursive: true });
      await fs.promises.copyFile(sourcePath, targetPath);
    } catch (err) {
      throw new BadRequestException(
        'Cannot preserve submitted CV before deletion',
      );
    }

    application.submittedCvOriginalCvId = cv.id;
    application.submittedCvFileName = cv.fileName || safeFileName;
    application.submittedCvFileUrl = `${snapshotPath}/${safeFileName}`;
  }
}
