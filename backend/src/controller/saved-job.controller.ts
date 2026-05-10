import {
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/common/decorator/decorator';
import { UserRole } from 'src/common/enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
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

    @Get('admin')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.HR)
    async findAllForAdmin(
        @Query('vacancyId') vacancyId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<ApiResponse<any>> {
        const data = await this.savedJobService.findAllForAdmin({
            vacancyId: vacancyId ? Number(vacancyId) : undefined,
            page: page ? Math.max(1, Number(page)) : 1,
            limit: limit ? Math.max(1, Number(limit)) : 10,
        });
        return {
            statusCode: HttpStatus.OK,
            message: 'Favorite jobs retrieved',
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
