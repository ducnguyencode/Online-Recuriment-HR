import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { InAppNotification } from '../../core/models';

@Component({
  selector: 'app-LNotifications',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Notifications</h1>
          <p class="page-subtitle">
            Track workflow events such as new applications, interview schedules,
            and reminders.
          </p>
        </div>
        <button class="btn-secondary" (click)="markAllRead()">
          Mark all as read
        </button>
      </div>

      <div class="filters-bar">
        <select
          class="form-select"
          style="width:180px"
          [(ngModel)]="filter"
          (change)="loadNotifications()"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <span class="result-count"
          >{{ notifications().length }} notifications</span
        >
      </div>

      <div class="card" style="padding: 8px;">
        @for (item of notifications(); track item.id) {
          <div class="notification-item" [class.unread]="!item.isRead">
            <div
              class="notification-dot"
              [ngClass]="getTypeClass(item.type)"
            ></div>
            <div class="notification-content">
              <div class="notification-top">
                <div>
                  <h3 class="notification-title">{{ item.title }}</h3>
                  <p class="notification-message">{{ item.message }}</p>
                </div>
                <span class="badge" [ngClass]="getTypeBadge(item.type)">{{
                  item.type
                }}</span>
              </div>
              <div class="notification-meta">
                <span>{{ item.createdAt | date: 'MM/dd/yyyy HH:mm' }}</span>
                @if (item.linkUrl) {
                  <span>{{ item.linkUrl }}</span>
                }
              </div>
            </div>
            @if (!item.isRead) {
              <button class="btn-ghost btn-sm" (click)="markRead(item.id)">
                Mark read
              </button>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <div class="empty-icon">🔔</div>
            <p>No notifications available</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .filters-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .result-count {
        margin-left: auto;
        color: var(--shell-text-soft);
        font-size: 12px;
      }
      .notification-item {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 14px 12px;
        border-radius: 18px;
        transition: background 0.2s ease;
      }
      .notification-item + .notification-item {
        margin-top: 6px;
      }
      .notification-item:hover {
        background: var(--shell-surface-soft);
      }
      .notification-item.unread {
        background: linear-gradient(
          90deg,
          rgba(59, 130, 246, 0.06),
          transparent 55%
        );
      }
      .notification-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-top: 8px;
        flex-shrink: 0;
      }
      .notification-content {
        flex: 1;
        min-width: 0;
      }
      .notification-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .notification-title {
        margin: 0 0 4px;
        color: var(--shell-text-strong);
        font-size: 14px;
        font-weight: 600;
      }
      .notification-message {
        margin: 0;
        color: var(--shell-text);
        font-size: 13px;
        line-height: 1.6;
      }
      .notification-meta {
        display: flex;
        gap: 14px;
        margin-top: 8px;
        color: var(--shell-text-soft);
        font-size: 11px;
        flex-wrap: wrap;
      }
      .type-info {
        background: var(--shell-brand);
      }
      .type-success {
        background: var(--shell-success);
      }
      .type-warning {
        background: var(--shell-warning);
      }
      .type-error {
        background: var(--shell-danger);
      }
      @media (max-width: 700px) {
        .notification-top {
          flex-direction: column;
        }
        .filters-bar {
          flex-wrap: wrap;
        }
        .result-count {
          margin-left: 0;
        }
      }
    `,
  ],
})
export class NotificationsComponent implements OnInit {
  notifications = signal<InAppNotification[]>([]);
  filter: 'all' | 'unread' | 'read' = 'all';

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    const isRead = this.filter === 'all' ? undefined : this.filter === 'read';
    this.notificationService.getAll(1, 20, isRead).subscribe({
      next: (res) => {
        const items: InAppNotification[] =
          (res.data as any)?.items ?? res.data ?? [];
        this.notifications.set(items);
      },
      error: () => this.notifications.set([]),
    });
  }

  markRead(id: string) {
    this.notificationService.markRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => this.loadNotifications(),
    });
  }

  markAllRead() {
    this.notificationService.markAllRead().subscribe({
      next: () => this.loadNotifications(),
      error: () => this.loadNotifications(),
    });
  }

  getTypeClass(type: string) {
    return (
      {
        INFO: 'type-info',
        SUCCESS: 'type-success',
        WARNING: 'type-warning',
        ERROR: 'type-error',
      }[type] ?? 'type-info'
    );
  }

  getTypeBadge(type: string) {
    return (
      {
        INFO: 'badge-info',
        SUCCESS: 'badge-success',
        WARNING: 'badge-warning',
        ERROR: 'badge-danger',
      }[type] ?? 'badge-info'
    );
  }
}
