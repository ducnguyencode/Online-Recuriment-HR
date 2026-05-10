import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApplicantService } from '../../core/services/applicant.service';
import { ApplicationService } from '../../core/services/application.service';
import { VacancyService } from '../../core/services/vacancy.service';
import { UserAccount, UserRole } from '../../core/models';

interface MenuMatch {
  label: string;
  route: string;
  hrOnly?: boolean;
  hrOnlyStrict?: boolean;
  superadminOnly?: boolean;
}

interface VacancyMatch {
  id: string;
  title: string;
  code: string;
}

interface ApplicantMatch {
  id: string;
  fullName: string;
  email: string;
}

interface ApplicationMatch {
  id: string;
  code: string;
  applicantName: string;
  vacancyTitle: string;
}

const MENU_INDEX: MenuMatch[] = [
  { label: 'Dashboard', route: '/hr-portal' },
  { label: 'Vacancies', route: '/hr-portal/vacancies', hrOnly: true },
  { label: 'Applicants', route: '/hr-portal/applicants', hrOnly: true },
  { label: 'Applications', route: '/hr-portal/applications', hrOnly: true },
  { label: 'Interviews', route: '/hr-portal/interviews' },
  { label: 'Reports', route: '/hr-portal/reports', hrOnly: true },
  { label: 'Favorite Jobs', route: '/hr-portal/favorite-jobs', hrOnly: true },
  { label: 'Staff Accounts', route: '/hr-portal/admin/staff', superadminOnly: true },
  { label: 'Staff Accounts', route: '/hr-portal/staff', hrOnlyStrict: true },
  { label: 'Audit Log', route: '/hr-portal/audit', hrOnly: true },
  { label: 'Notifications', route: '/hr-portal/notifications' },
  { label: 'Profile', route: '/hr-portal/profile' },
  { label: 'Help', route: '/hr-portal/help' },
];

@Component({
  selector: 'app-hr-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, FormsModule],
  template: `
    <div class="hr-layout">
      <app-sidebar />
      <div class="main-area" [class.sidebar-collapsed]="false">
        <header class="top-header">
          <div class="header-search-wrap">
            <div class="header-search" [class.has-results]="showSearchResults()">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                #searchInput
                type="text"
                placeholder="Search menu, applicants, vacancies, interviews..."
                [(ngModel)]="headerSearchQuery"
                (ngModelChange)="onSearchInput($event)"
                (focus)="onSearchFocus()"
                (keydown.enter)="performHeaderSearch()"
                (keydown.escape)="closeSearchResults()"
              />
              <span class="search-kbd">/</span>
            </div>

            @if (showSearchResults()) {
              <div class="search-backdrop" (click)="closeSearchResults()"></div>
              <div class="search-dropdown">
                @if (searchLoading()) {
                  <div class="search-empty">Searching...</div>
                } @else if (totalSearchResults() === 0) {
                  <div class="search-empty">
                    No results for "{{ headerSearchQuery }}"
                  </div>
                } @else {
                  @if (menuMatches().length > 0) {
                    <div class="search-section">
                      <div class="search-section-title">Menu</div>
                      @for (m of menuMatches(); track m.route) {
                        <a class="search-item" [routerLink]="m.route" (click)="closeSearchResults()">
                          <span class="search-item-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                          </span>
                          <span class="search-item-label">{{ m.label }}</span>
                          <span class="search-item-meta">{{ m.route }}</span>
                        </a>
                      }
                    </div>
                  }

                  @if (vacancyMatches().length > 0) {
                    <div class="search-section">
                      <div class="search-section-title">Vacancies</div>
                      @for (v of vacancyMatches(); track v.id) {
                        <a class="search-item" routerLink="/hr-portal/vacancies" [queryParams]="{ search: v.title }" (click)="closeSearchResults()">
                          <span class="search-item-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
                          </span>
                          <span class="search-item-label">{{ v.title }}</span>
                          <span class="search-item-meta">{{ v.code }}</span>
                        </a>
                      }
                    </div>
                  }

                  @if (applicantMatches().length > 0) {
                    <div class="search-section">
                      <div class="search-section-title">Applicants</div>
                      @for (a of applicantMatches(); track a.id) {
                        <a class="search-item" routerLink="/hr-portal/applicants" [queryParams]="{ search: a.fullName }" (click)="closeSearchResults()">
                          <span class="search-item-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </span>
                          <span class="search-item-label">{{ a.fullName }}</span>
                          <span class="search-item-meta">{{ a.email }}</span>
                        </a>
                      }
                    </div>
                  }

                  @if (applicationMatches().length > 0) {
                    <div class="search-section">
                      <div class="search-section-title">Applications</div>
                      @for (a of applicationMatches(); track a.id) {
                        <a class="search-item" routerLink="/hr-portal/applications" [queryParams]="{ search: a.code }" (click)="closeSearchResults()">
                          <span class="search-item-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                          </span>
                          <span class="search-item-label">{{ a.code }} · {{ a.applicantName }}</span>
                          <span class="search-item-meta">{{ a.vacancyTitle }}</span>
                        </a>
                      }
                    </div>
                  }
                }
              </div>
            }
          </div>
          <div class="header-right">
            <div class="notification-wrapper">
              <button
                class="header-icon-btn notification-btn"
                title="Notifications"
                (click)="toggleNotifications()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span class="notification-badge" *ngIf="notifService.unreadCount() > 0">
                  {{ notifService.unreadCount() }}
                </span>
              </button>

              <div class="notif-dropdown" *ngIf="showNotifDropdown()">
                <div class="notif-header">
                  <h3>Notifications</h3>
                  <button class="mark-all-btn" *ngIf="notifService.unreadCount() > 0" (click)="markAllAsRead()">
                    Mark all as read
                  </button>
                </div>
                
                <div class="notif-body">
                  <!-- Trạng thái trống -->
                  <div class="empty-notif" *ngIf="notifService.notifications().length === 0">
                    You have no notifications.
                  </div>
                  
                  <div 
                    class="notif-item" 
                    *ngFor="let notif of notifService.notifications()"
                    [class.unread]="!notif.isRead"
                    (click)="onNotificationClick(notif)"
                  >
                    <div class="notif-content">
                      <div class="notif-title">{{ notif.title }}</div>
                      <div class="notif-message">{{ notif.message }}</div>
                      <div class="notif-time">{{ notif.createdAt | date:'short' }}</div>
                    </div>

                    <div class="unread-dot" *ngIf="!notif.isRead"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="user-dropdown-wrapper">
              <button class="header-user" (click)="toggleUserDropdown()" type="button">
                <img
                  class="header-avatar-img"
                  [src]="avatarUrl()"
                  [alt]="authService.currentUser()?.fullName || 'avatar'"
                />
                <div class="header-user-copy">
                  <span class="header-username">{{ authService.currentUser()?.fullName }}</span>
                  <span class="header-user-meta">{{ authService.currentUser()?.role }}</span>
                </div>
                <svg
                  class="header-user-caret"
                  [class.rotated]="showUserDropdown()"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              @if (showUserDropdown()) {
                <div class="user-dropdown-backdrop" (click)="showUserDropdown.set(false)"></div>
                <div class="user-dropdown">
                  <div class="user-dropdown-header">
                    <img class="user-dropdown-avatar" [src]="avatarUrl()" alt="avatar" />
                    <div class="user-dropdown-info">
                      <span class="user-dropdown-name">{{ authService.currentUser()?.fullName }}</span>
                      <span class="user-dropdown-email">{{ authService.currentUser()?.email }}</span>
                      <span class="user-dropdown-role">
                        {{ authService.currentUser()?.role }}
                        <span class="dev-tag">DEV</span>
                      </span>
                    </div>
                  </div>

                  <div class="user-dropdown-divider"></div>

                  <a
                    class="user-dropdown-item"
                    routerLink="/hr-portal/profile"
                    (click)="showUserDropdown.set(false)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                  </a>

                  <button class="user-dropdown-item" type="button" (click)="toggleRoleSubmenu()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 11h-6"/>
                      <path d="M19 8v6"/>
                    </svg>
                    Switch Role (DEV)
                  </button>

                  @if (showRoleSubmenu()) {
                    <div class="user-dropdown-roles">
                      @for (r of devRoles; track r.role) {
                        <button
                          class="user-dropdown-role-item"
                          type="button"
                          [class.active]="authService.currentUser()?.role === r.role"
                          (click)="switchRole(r.role)"
                        >
                          <span class="role-dot">{{ r.label.charAt(0) }}</span>
                          <span class="role-info">
                            <span class="role-label">{{ r.label }}</span>
                            <span class="role-email">{{ r.email }}</span>
                          </span>
                        </button>
                      }
                    </div>
                  }

                  <div class="user-dropdown-divider"></div>

                  <button class="user-dropdown-item user-dropdown-danger" type="button" (click)="logout()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" x2="9" y1="12" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
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
        position: relative;
        flex: 1;
        max-width: 460px;
      }

      .search-backdrop {
        position: fixed;
        inset: 0;
        z-index: 90;
      }

      .search-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        max-height: 480px;
        overflow-y: auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
        z-index: 100;
        padding: 8px;
      }

      .search-empty {
        padding: 24px 16px;
        text-align: center;
        color: #94a3b8;
        font-size: 13px;
      }

      .search-section {
        padding: 4px 0;
      }

      .search-section + .search-section {
        border-top: 1px solid #f1f5f9;
        margin-top: 4px;
        padding-top: 8px;
      }

      .search-section-title {
        padding: 4px 10px 6px;
        color: #94a3b8;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .search-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 10px;
        text-decoration: none;
        color: #334155;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .search-item:hover {
        background: #f1f5f9;
      }

      .search-item-icon {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: #eff6ff;
        color: #3b82f6;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .search-item-label {
        flex: 1;
        min-width: 0;
        font-weight: 500;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .search-item-meta {
        font-size: 11px;
        color: #94a3b8;
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
        transition:
          color 0.2s ease,
          background 0.2s ease;
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

      .user-dropdown-wrapper {
        position: relative;
      }

      .header-user {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 10px 4px 4px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        transition:
          background 0.2s ease,
          border-color 0.2s ease;
      }

      .header-user:hover {
        background: #f8fbff;
        border-color: #cbd5e1;
      }

      .header-avatar-img {
        width: 32px;
        height: 32px;
        border-radius: 12px;
        background: #f1f5f9;
        flex-shrink: 0;
        object-fit: cover;
      }

      .header-user-caret {
        color: #94a3b8;
        transition: transform 0.2s ease;
      }

      .header-user-caret.rotated {
        transform: rotate(180deg);
      }

      .user-dropdown-backdrop {
        position: fixed;
        inset: 0;
        z-index: 90;
      }

      .user-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 280px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
        z-index: 100;
        overflow: hidden;
        padding: 8px;
      }

      .user-dropdown-header {
        display: flex;
        gap: 12px;
        padding: 8px 8px 12px;
      }

      .user-dropdown-avatar {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: #f1f5f9;
        flex-shrink: 0;
      }

      .user-dropdown-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1;
      }

      .user-dropdown-name {
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-dropdown-email {
        font-size: 11px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-dropdown-role {
        margin-top: 4px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #475569;
      }

      .dev-tag {
        display: inline-flex;
        align-items: center;
        height: 14px;
        padding: 0 5px;
        border-radius: 4px;
        background: #fef9c3;
        color: #ca8a04;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .user-dropdown-divider {
        height: 1px;
        background: #e2e8f0;
        margin: 4px 0;
      }

      .user-dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 9px 10px;
        border: none;
        background: transparent;
        border-radius: 10px;
        font-size: 13px;
        color: #334155;
        cursor: pointer;
        text-align: left;
        text-decoration: none;
        transition: background 0.15s ease;
      }

      .user-dropdown-item:hover {
        background: #f1f5f9;
      }

      .user-dropdown-item svg {
        color: #64748b;
      }

      .user-dropdown-danger {
        color: #dc2626;
      }

      .user-dropdown-danger:hover {
        background: #fef2f2;
      }

      .user-dropdown-danger svg {
        color: #dc2626;
      }

      .user-dropdown-roles {
        margin: 4px 0 4px;
        padding: 4px;
        background: #f8fafc;
        border-radius: 10px;
      }

      .user-dropdown-role-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s ease;
      }

      .user-dropdown-role-item:hover {
        background: #ffffff;
      }

      .user-dropdown-role-item.active {
        background: #eff6ff;
      }

      .role-dot {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: #eff6ff;
        color: #3b82f6;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .role-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .role-label {
        font-size: 12px;
        font-weight: 600;
        color: #0f172a;
      }

      .role-email {
        font-size: 10px;
        color: #94a3b8;
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

      .notification-wrapper {
        position: relative;
      }

      .notif-dropdown {
        position: absolute;
        top: 48px;
        right: 0;
        width: 340px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
        border: 1px solid #e2e8f0;
        z-index: 100;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .notif-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .notif-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
      }

      .mark-all-btn {
        background: transparent;
        border: none;
        color: #3b82f6;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: background 0.2s ease;
      }

      .mark-all-btn:hover {
        background: #eff6ff;
      }

      .notif-body {
        max-height: 400px;
        overflow-y: auto;
      }

      .empty-notif {
        padding: 32px 20px;
        text-align: center;
        color: #94a3b8;
        font-size: 13px;
      }

      .notif-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .notif-item:hover {
        background: #f8fafc;
      }

      .notif-item.unread {
        background: #eff6ff;
      }

      .notif-content {
        flex: 1;
        min-width: 0;
      }

      .notif-title {
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 4px;
      }

      .notif-message {
        font-size: 12px;
        color: #475569;
        line-height: 1.5;
        /* Rút gọn text nếu quá 2 dòng */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .notif-time {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 8px;
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
        flex-shrink: 0;
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
    `,
  ],
})
export class HrLayoutComponent implements OnInit {
  showNotifDropdown = signal(false);
  showUserDropdown = signal(false);
  showRoleSubmenu = signal(false);
  headerSearchQuery = '';

  showSearchResults = signal(false);
  searchLoading = signal(false);
  menuMatches = signal<MenuMatch[]>([]);
  vacancyMatches = signal<VacancyMatch[]>([]);
  applicantMatches = signal<ApplicantMatch[]>([]);
  applicationMatches = signal<ApplicationMatch[]>([]);

  readonly totalSearchResults = computed(() =>
    this.menuMatches().length +
    this.vacancyMatches().length +
    this.applicantMatches().length +
    this.applicationMatches().length,
  );

  private searchInput$ = new Subject<string>();

  readonly devRoles: { role: UserAccount['role']; label: string; email: string }[] = [
    { role: UserRole.SUPER_ADMIN, label: UserRole.SUPER_ADMIN, email: 'admin@abc.com' },
    { role: UserRole.HR, label: UserRole.HR, email: 'an.nguyen@abc.com' },
    { role: UserRole.INTERVIEWER, label: UserRole.INTERVIEWER, email: 'cuong.le@abc.com' },
  ];

  readonly avatarUrl = computed(() => {
    const seed = this.authService.currentUser()?.fullName || 'guest';
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  });

  constructor(
    public authService: AuthService,
    public notifService: NotificationService,
    private router: Router,
    private applicantService: ApplicantService,
    private applicationService: ApplicationService,
    private vacancyService: VacancyService,
  ) { }

  ngOnInit(): void {
    this.notifService.getAll().subscribe();
    this.notifService.connectSocket();

    this.searchInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => this.runSearch(q)),
      )
      .subscribe();
  }

  private runSearch(query: string) {
    const q = query.trim();
    if (!q) {
      this.menuMatches.set([]);
      this.vacancyMatches.set([]);
      this.applicantMatches.set([]);
      this.applicationMatches.set([]);
      this.searchLoading.set(false);
      return Promise.resolve();
    }

    this.menuMatches.set(this.filterMenu(q));

    const isHrOrSA = this.authService.isHR() || this.authService.isSuperadmin();
    if (!isHrOrSA) {
      this.searchLoading.set(false);
      return Promise.resolve();
    }

    this.searchLoading.set(true);

    this.vacancyService.getAll({ search: q, limit: 5 }).subscribe({
      next: (res) => {
        const items: any[] = (res.data as any)?.items ?? [];
        this.vacancyMatches.set(
          items.map((v) => ({
            id: String(v.id),
            title: v.title,
            code: v.code,
          })),
        );
      },
      error: () => this.vacancyMatches.set([]),
    });

    this.applicantService.getAll({ search: q, limit: 5 }).subscribe({
      next: (res) => {
        const items: any[] = (res.data as any)?.items ?? [];
        this.applicantMatches.set(
          items.map((a) => ({
            id: String(a.id),
            fullName: a.user?.fullName || a.fullName || '',
            email: a.user?.email || a.email || '',
          })),
        );
      },
      error: () => this.applicantMatches.set([]),
    });

    this.applicationService.getAll({ search: q, limit: 5 }).subscribe({
      next: (res) => {
        const items: any[] = (res.data as any)?.items ?? [];
        this.applicationMatches.set(
          items.map((a) => ({
            id: String(a.id),
            code: a.code || `R${String(a.id).padStart(4, '0')}`,
            applicantName: a.applicant?.user?.fullName || a.applicant?.fullName || '—',
            vacancyTitle: a.vacancy?.title || '—',
          })),
        );
        this.searchLoading.set(false);
      },
      error: () => {
        this.applicationMatches.set([]);
        this.searchLoading.set(false);
      },
    });

    return Promise.resolve();
  }

  private filterMenu(query: string): MenuMatch[] {
    const q = query.toLowerCase();
    return MENU_INDEX.filter((m) => {
      if (m.superadminOnly && !this.authService.isSuperadmin()) return false;
      if (m.hrOnlyStrict && !this.authService.isHR()) return false;
      if (m.hrOnly && !(this.authService.isHR() || this.authService.isSuperadmin())) return false;
      return m.label.toLowerCase().includes(q);
    });
  }

  onSearchInput(value: string) {
    this.showSearchResults.set(value.trim().length > 0);
    this.searchInput$.next(value);
  }

  onSearchFocus() {
    if (this.headerSearchQuery.trim()) {
      this.showSearchResults.set(true);
    }
  }

  closeSearchResults() {
    this.showSearchResults.set(false);
  }

  performHeaderSearch() {
    const query = this.headerSearchQuery.trim();
    if (!query) return;
    const firstMenu = this.menuMatches()[0];
    if (firstMenu) {
      this.router.navigateByUrl(firstMenu.route);
    } else {
      this.router.navigate(['/hr-portal/applications'], { queryParams: { search: query } });
    }
    this.closeSearchResults();
  }

  toggleNotifications() {
    this.showNotifDropdown.update((v) => !v);
  }

  toggleUserDropdown() {
    this.showUserDropdown.update((v) => !v);
    if (!this.showUserDropdown()) {
      this.showRoleSubmenu.set(false);
    }
  }

  toggleRoleSubmenu() {
    this.showRoleSubmenu.update((v) => !v);
  }

  switchRole(role: UserAccount['role']) {
    this.authService.mockLoginAsRole(role);
    this.showRoleSubmenu.set(false);
    this.showUserDropdown.set(false);
    this.router.navigate(['/hr-portal']);
  }

  logout() {
    this.showUserDropdown.set(false);
    this.authService.logout('/hr/login');
  }

  onNotificationClick(notif: any) {
    if (!notif.isRead) {
      this.notifService.markRead(notif.id).subscribe();
    }

    if (notif.linkUrl) {
      this.router.navigateByUrl(notif.linkUrl);
      this.showNotifDropdown.set(false);
    }
  }

  markAsRead(id: string, linkUrl?: string) {
    this.notifService.markRead(id).subscribe();
  }

  markAllAsRead() {
    this.notifService.markAllRead().subscribe();
  }
}
