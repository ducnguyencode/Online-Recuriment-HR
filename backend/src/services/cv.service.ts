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
    let cv = this.cvsTable.create({
      ...data,
      applicant: { id: data.applicantId },
    });

    cv = await this.cvsTable.save(cv);

    if (file) {
      // get file name
      const fileName = `${cv.id}.pdf`;
      const uploadDir = path.join(process.cwd(), 'uploads/cv');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);

      cv.fileUrl = fileName;

      await this.cvsTable.save(cv);
    }

    return cv;
  }
}
