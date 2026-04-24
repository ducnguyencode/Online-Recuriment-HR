import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ReportDto } from 'src/dto/report.dto';
import { ApiResponse } from 'src/helper/api-response';
import { ReportService } from 'src/services/report.service';

@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}
  @Get()
  async recruitmentReport(): Promise<ApiResponse<ReportDto>> {
    const data = await this.reportService.recruitmentReport();
    return {
      statusCode: HttpStatus.OK,
      message: 'Success',
      data,
    };
  }
}
