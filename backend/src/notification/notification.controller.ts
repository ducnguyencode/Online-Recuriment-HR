/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { NotificationsService } from './notification.service';

// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { AuthUser } from '../auth/interfaces/auth-user.interface';

// @UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get()
  async getAll(
    @Req() req: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('isRead') isRead?: string,
  ) {
    const userId = req.user?.id || 'admin-user-id';

    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 10;

    const data = await this.notifService.findAllForUser(userId, p, l, isRead);

    return {
      statusCode: 200,
      message: 'Get all notifications successfully',
      data: data,
    };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    const data = await this.notifService.markAsRead(id);
    return {
      statusCode: 200,
      message: 'Mark as read successfully',
      data: data,
    };
  }

  @Patch('read-all')
  async markAllRead(@Req() req: any) {
    const userId = req.user?.id || 'admin-user-id';
    const data = await this.notifService.markAllAsRead(userId);
    return {
      statusCode: 200,
      message: 'Mark all as read successfully',
      data: data,
    };
  }
}
