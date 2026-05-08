import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-applicant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applicant-layout.html',
  styleUrls: ['./applicant-layout.scss'],
})
export class ApplicantLayoutComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoggedIn = this.auth.isLoggedIn;
  userName = () => this.auth.currentUser()?.fullName || 'Applicant';

  // Dropdown state management
  isDropdownOpen = signal(false);

  toggleDropdown() {
    this.isDropdownOpen.update((v) => !v);
  }

  // Auto-close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown-wrapper')) {
      this.isDropdownOpen.set(false);
    }
  }

  // Ẩn navbar cho forgot-password HR để full màn hình như /hr/login
  get isHrForgotPassword(): boolean {
    const child = this.route.firstChild;
    if (!child) return false;
    const scope = child.snapshot.queryParamMap.get('scope');
    return scope === 'hr';
  }

  // Đang ở trang auth (login / register / forgot-password) → hiện nút Back to Careers thay vì Sign In
  get isAuthPage(): boolean {
    const url = this.router.url;
    return url.startsWith('/login') || url.startsWith('/register') || url.startsWith('/forgot-password');
  }

  logout() {
    this.auth.logout();
    this.isDropdownOpen.set(false);
    this.router.navigate(['/login']);
  }
}
