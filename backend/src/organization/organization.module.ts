import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from 'src/entities/department.entity';
import { Employee } from 'src/entities/employee.entity';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [TypeOrmModule.forFeature([Department, Employee])],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule {}
