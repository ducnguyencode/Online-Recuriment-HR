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

  private normalizeNotification<T extends InAppNotification>(item: T): T {
    const submittedCvMatch = item.message?.match(
      new RegExp(
        '^\\u1EE8ng vi\\u00EAn (.+) v\\u1EEBa n\\u1ED9p CV v\\u00E0o v\\u1ECB tr\\u00ED (.+)\\.$',
      ),
    );
    if (submittedCvMatch) {
      return {
        ...item,
        message: `${submittedCvMatch[1]} submitted a CV for ${submittedCvMatch[2]}.`,
      };
    }

    return item;
  }

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

    // Apply read/unread filtering when requested by the frontend.
    if (isRead !== undefined) {
      const isReadBool = isRead === 'true';
      query.andWhere('notif.isRead = :isRead', { isRead: isReadBool });
    }

    const [items, total] = await query.getManyAndCount();

    return {
      items: items.map((item) => this.normalizeNotification(item)),
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
