import { Controller, Get, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { OverviewDto } from 'src/dto/dashboard/overview.dto';
import { ApiResponse } from 'src/helper/api-response';
import { DashboardService } from 'src/services/dashboard.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorator/decorator';
import { UserRole } from 'src/common/enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('system-overview')
  async systemOverview(): Promise<ApiResponse<any>> {
    const data = await this.dashboardService.systemOverview();
    return {
      statusCode: HttpStatus.OK,
      message: 'Success',
      data,
    };
  }

  @Get('activity-overview')
  async activityOverview(): Promise<ApiResponse<OverviewDto>> {
    const data = await this.dashboardService.activityOverview();
    return {
      statusCode: HttpStatus.OK,
      message: 'Success',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('interviewer-overview')
  async interviewerOverview(@Req() req: any): Promise<ApiResponse<any>> {
    const user = req.user as any;
    const data = await this.dashboardService.interviewerOverview(
      user.id,
      user.employeeId ?? user.employee?.id,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Success',
      data,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR)
  @Get('recruitment-reports')
  async recruitmentReports(): Promise<ApiResponse<any>> {
    const data = await this.dashboardService.recruitmentReports();
    return {
      statusCode: HttpStatus.OK,
      message: 'Success',
      data,
    };
  }
}
