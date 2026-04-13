import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserAccount } from '../../../core/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  hrOnly?: boolean;
  interviewerVisible?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  collapsed = signal(false);
  showRoleMenu = signal(false);

  menuItems: NavItem[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', route: '/hr-portal' },
    { label: 'Vacancies', icon: 'briefcase', route: '/hr-portal/vacancies', hrOnly: true },
    { label: 'Applicants', icon: 'users', route: '/hr-portal/applicants', hrOnly: true },
    { label: 'Applications', icon: 'file-text', route: '/hr-portal/applications', hrOnly: true },
    { label: 'Kanban Board', icon: 'columns-3', route: '/hr-portal/applications/kanban', hrOnly: true },
    { label: 'Interviews', icon: 'calendar', route: '/hr-portal/interviews' },
    { label: 'Reports', icon: 'bar-chart-3', route: '/hr-portal/reports', hrOnly: true },
  ];

  systemItems: NavItem[] = [
    { label: 'Audit Log', icon: 'clipboard-list', route: '/hr-portal/audit', hrOnly: true },
    { label: 'Notifications', icon: 'bell', route: '/hr-portal/notifications' },
    { label: 'Profile', icon: 'settings', route: '/hr-portal/profile' },
    { label: 'Help', icon: 'circle-help', route: '/hr-portal/help' },
  ];

  readonly devRoles: { role: UserAccount['role']; label: string; email: string }[] = [
    { role: 'HR', label: 'HR Staff', email: 'an.nguyen@abc.com' },
    { role: 'Interviewer', label: 'Interviewer', email: 'cuong.le@abc.com' },
  ];

  constructor(public auth: AuthService, private router: Router) {}

  get visibleMenuItems(): NavItem[] {
    return this.menuItems.filter(item => !item.hrOnly || this.auth.isHR());
  }

  get visibleSystemItems(): NavItem[] {
    return this.systemItems.filter(item => !item.hrOnly || this.auth.isHR());
  }

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }

  toggleRoleMenu() {
    this.showRoleMenu.update(v => !v);
  }

  switchRole(role: UserAccount['role']) {
    this.auth.mockLoginAsRole(role);
    this.showRoleMenu.set(false);
    this.router.navigate(['/hr-portal']);
  }

  logout() {
    this.auth.logout();
  }
}
