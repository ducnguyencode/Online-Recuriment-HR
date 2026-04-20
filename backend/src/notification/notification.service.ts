/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InAppNotification } from 'src/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(InAppNotification)
    private readonly notifRepo: Repository<InAppNotification>,
  ) {}

  // Save new notification to DB
  async create(data: any) {
    const newNotif = this.notifRepo.create({
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    return await this.notifRepo.save(newNotif);
  }

  // Get all notifications for a user
  async findAllForUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
    isRead?: string,
  ) {
    const query = this.notifRepo
      .createQueryBuilder('notif')
      .where('notif.userId = :userId', { userId })
      .orderBy('notif.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Nếu Frontend có truyền isRead (true/false) thì lọc thêm
    if (isRead !== undefined) {
      const isReadBool = isRead === 'true';
      query.andWhere('notif.isRead = :isRead', { isRead: isReadBool });
    }

    const [items, total] = await query.getManyAndCount();

    // Trả về format PaginatedResponse mà Frontend mong đợi
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Mark notification as read
  async markAsRead(id: string) {
    await this.notifRepo.update(id, { isRead: true });
    return await this.notifRepo.findOne({ where: { id } });
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }
}
