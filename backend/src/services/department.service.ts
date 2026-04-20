import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll(): Promise<Department[]> {
    return await this.deparmentsTable.find();
  }

  async create(data: DepartmentCreateDto) {
    return this.deparmentsTable.manager.transaction(async (manager) => {
      const department = manager.create(Department, data);
      return await manager.save(department);
    });
  }

  async changeStatus(id: number, status: boolean) {
    const department = await this.deparmentsTable.findOneBy({ id });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    department.isActive = status;

    return this.deparmentsTable.save(department);
  }
}
