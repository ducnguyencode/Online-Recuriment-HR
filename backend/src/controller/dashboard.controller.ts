import { Controller, Get, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { OverviewDto } from 'src/dto/dashboard/overview.dto';
import { ApiResponse } from 'src/helper/api-response';
import { DashboardService } from 'src/services/dashboard.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { Request } from 'express';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

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
  async interviewerOverview(@Req() req: Request): Promise<ApiResponse<any>> {
    const user = req.user as any;
    const data = await this.dashboardService.interviewerOverview(user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Success',
      data,
    };
  }
}
