import { Controller, Get } from '@nestjs/common';
import { DashboardService } from 'src/services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('vacancy-overview')
  vacancyOverview() {
    return this.dashboardService.vacancyOverview();
  }
}
