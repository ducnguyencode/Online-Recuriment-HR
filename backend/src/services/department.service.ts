import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from 'src/entities/department.entity';
import { DepartmentCreateDto } from 'src/dto/department.create.dto';
import { Repository } from 'typeorm';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private deparmentsTable: Repository<Department>,
  ) {}

  create(data: DepartmentCreateDto) {
    const department = this.deparmentsTable.create(data);
    return this.deparmentsTable.save(department);
  }

  findAll(): Promise<Department[]> {
    return this.deparmentsTable.find();
  }
}
