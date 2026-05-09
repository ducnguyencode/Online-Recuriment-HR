import {
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiResponse } from 'src/helper/api-response';
import { SavedJobService } from 'src/services/saved-job.service';

@Controller('favorite-jobs')
@UseGuards(JwtAuthGuard)
export class SavedJobController {
    constructor(private savedJobService: SavedJobService) {}

    @Get()
    async findAll(@Req() req: any): Promise<ApiResponse<any[]>> {
        const userId = req.user.id;
        const data = await this.savedJobService.findAllByUser(userId);
        return {
            statusCode: HttpStatus.OK,
            message: 'Saved jobs retrieved',
            data,
        };
    }

    @Get('check/:vacancyId')
    async check(
        @Req() req: any,
        @Param('vacancyId') vacancyId: number,
    ): Promise<ApiResponse<{ saved: boolean }>> {
        const userId = req.user.id;
        const saved = await this.savedJobService.isSaved(userId, vacancyId);
        return {
            statusCode: HttpStatus.OK,
            message: 'Check result',
            data: { saved },
        };
    }

    @Post('toggle/:vacancyId')
    async toggle(
        @Req() req: any,
        @Param('vacancyId') vacancyId: number,
    ): Promise<ApiResponse<{ saved: boolean }>> {
        const userId = req.user.id;
        const result = await this.savedJobService.toggle(userId, vacancyId);
        return {
            statusCode: HttpStatus.OK,
            message: result.saved ? 'Job saved' : 'Job unsaved',
            data: result,
        };
    }
}
