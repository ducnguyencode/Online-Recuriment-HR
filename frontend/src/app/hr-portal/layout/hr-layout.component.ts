import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hr-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="hr-layout">
      <app-sidebar />
      <div class="main-area" [class.sidebar-collapsed]="false">
        <header class="top-header">
          <div class="header-search-wrap">
            <div class="header-search">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" placeholder="Search applicants, vacancies, interviews..." />
              <span class="search-kbd">/</span>
            </div>
          </div>
          <div class="header-right">
            <button class="header-icon-btn notification-btn" title="Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span class="notification-badge">3</span>
            </button>
            <div class="header-user">
              <div class="header-avatar">
                {{ auth.currentUser()?.fullName?.charAt(0) || '?' }}
              </div>
              <div class="header-user-copy">
                <span class="header-username">{{ auth.currentUser()?.fullName }}</span>
                <span class="header-user-meta">{{ auth.currentUser()?.employeeId || auth.currentUser()?.applicantId || auth.currentUser()?.role }}</span>
              </div>
            </div>
          </div>
        </header>

        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .hr-layout {
      --sidebar-width: 215px;
      --sidebar-width-collapsed: 56px;
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }

    .main-area {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      min-width: 0;
      transition: margin-left 0.2s ease;
    }

    .main-area.sidebar-collapsed {
      margin-left: var(--sidebar-width-collapsed);
    }

    .top-header {
      min-height: 72px;
      background: rgba(248, 250, 252, 0.86);
      border-bottom: 1px solid #e2e8f0;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 24px;
      position: sticky;
      top: 0;
      z-index: 30;
    }

    .header-search-wrap {
      flex: 1;
      max-width: 460px;
    }

    .header-search {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 40px;
      padding: 0 14px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }

    .header-search svg {
      color: #94a3b8;
      flex-shrink: 0;
    }

    .header-search input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: #0f172a;
      font-size: 13px;
      font-weight: 500;
    }

    .header-search input::placeholder {
      color: #94a3b8;
    }

    .search-kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 600;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-icon-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #ffffff;
      color: #475569;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      cursor: pointer;
      transition: color 0.2s ease, background 0.2s ease;
    }

    .header-icon-btn:hover {
      background: #f8fbff;
      color: #0f172a;
    }

    .notification-badge {
      position: absolute;
      top: 3px;
      right: 3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 6px 4px 4px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .header-user:hover {
      background: #f8fbff;
      border-color: #cbd5e1;
    }

    .header-avatar {
      width: 28px;
      height: 28px;
      border-radius: 12px;
      background: #eff6ff;
      color: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 13px;
      flex-shrink: 0;
    }

    .header-user-copy {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .header-username {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-user-meta {
      font-size: 11px;
      color: #94a3b8;
    }

    .page-content {
      flex: 1;
      padding: 24px;
      background: transparent;
      overflow-y: auto;
    }

    .page-content > * {
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
    }

    @media (max-width: 900px) {
      .top-header {
        padding: 14px 16px;
      }

      .page-content {
        padding: 16px;
      }

      .header-search-wrap {
        max-width: none;
      }

      .header-user-copy {
        display: none;
      }
    }
  `]
})
export class HrLayoutComponent {
  constructor(public auth: AuthService) {}
}
