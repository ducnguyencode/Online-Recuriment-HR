import { Controller, Get, HttpStatus } from '@nestjs/common';
import { OverviewDto } from 'src/dto/dashboard/overview.dto';
import { ApiResponse } from 'src/helper/api-response';
import { DashboardService } from 'src/services/dashboard.service';

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
}
