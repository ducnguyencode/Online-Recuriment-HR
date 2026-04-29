import { Injectable } from '@nestjs/common';
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

  async create(data: CvCreateDto, file: Express.Multer.File) {
    if (!file) {
      return;
    }
    return this.cvsTable.manager.transaction(async (manager) => {
      let cv = manager.create(CV, {
        ...data,
        applicant: { id: data.applicantId },
      });
      cv = await manager.save(cv);

      if (file) {
        // get file name
        const fileName = `${cv.code}.pdf`;
        const filePath = `cv/applicant-${cv.applicantId}`;
        const uploadDir = path.join(process.cwd(), `uploads/${filePath}`);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save file
        const saveFilePath = path.join(uploadDir, fileName);
        fs.writeFileSync(saveFilePath, file.buffer);

        cv.fileUrl = `${filePath}/${fileName}`;
      }

      return manager.save(cv);
    });
  }
}
