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
      const fileName = file.originalname;
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
    return this.cvsTable.manager.transaction(async (manager) => {
      const existing = await manager.findOne(CV, { where: { id } });
      if (!existing) {
        throw new NotFoundException('CV not found');
      }

      const filePath = path.join(process.cwd(), 'uploads', existing.fileUrl);

      await manager.delete(CV, { id });

      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Fail to delete file: ', err);
      }

      return 'Delete success';
    });
  }
}
