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

  findAll(): Promise<Department[]> {
    return this.deparmentsTable.find();
  }

  create(data: DepartmentCreateDto) {
    return this.deparmentsTable.manager.transaction(async (manager) => {
      const department = manager.create(Department, data);
      const newDepartment = await manager.save(department);

      newDepartment.code = `D${newDepartment.id.toString().padStart(4, '0')}`;
      return manager.save(newDepartment);
    });
  }
}
