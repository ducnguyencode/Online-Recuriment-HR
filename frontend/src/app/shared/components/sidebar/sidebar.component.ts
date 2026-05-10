import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  hrOnly?: boolean;
  hrOnlyStrict?: boolean;
  superadminOnly?: boolean;
  interviewerVisible?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  collapsed = signal(false);

  menuItems: NavItem[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', route: '/hr-portal' },
    { label: 'Vacancies', icon: 'briefcase', route: '/hr-portal/vacancies', hrOnly: true },
    { label: 'Applicants', icon: 'users', route: '/hr-portal/applicants', hrOnly: true },
    { label: 'Applications', icon: 'file-text', route: '/hr-portal/applications', hrOnly: true },
    { label: 'Interviews', icon: 'calendar', route: '/hr-portal/interviews' },
    {
      label: 'Reports',
      icon: 'bar-chart-3',
      route: '/hr-portal/reports',
      hrOnly: true,
    },
    { label: 'Favorite Jobs', icon: 'star', route: '/hr-portal/favorite-jobs', hrOnly: true },
  ];

  systemItems: NavItem[] = [
    { label: 'Staff Accounts', icon: 'shield', route: '/hr-portal/admin/staff', superadminOnly: true },
    { label: 'Staff Accounts', icon: 'shield', route: '/hr-portal/staff', hrOnlyStrict: true },
    { label: 'Audit Log', icon: 'clipboard-list', route: '/hr-portal/audit', hrOnly: true },
    { label: 'Notifications', icon: 'bell', route: '/hr-portal/notifications' },
    { label: 'Profile', icon: 'settings', route: '/hr-portal/profile' },
    { label: 'Help', icon: 'circle-help', route: '/hr-portal/help' },
  ];

  constructor(
    public auth: AuthService,
    private router: Router,
  ) { }

  get visibleMenuItems(): NavItem[] {
    return this.menuItems.filter(item => this.canSee(item));
  }

  get visibleSystemItems(): NavItem[] {
    return this.systemItems.filter(item => this.canSee(item));
  }

  private canSee(item: NavItem): boolean {
    if (item.superadminOnly && !this.auth.isSuperadmin()) return false;
    if (item.hrOnlyStrict && !this.auth.isHR()) return false;
    if (item.hrOnly && !(this.auth.isHR() || this.auth.isSuperadmin())) return false;
    return true;
  }

  toggleCollapse() {
    this.collapsed.update((v) => !v);
  }
}
