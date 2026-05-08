import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-applicant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applicant-layout.html',
})
export class ApplicantLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Lắng nghe trạng thái login thật
  isLoggedIn = computed(() => !!this.authService.currentUser());

  // Lấy tên từ AuthService
  userName = computed(() => this.authService.currentUser()?.fullName ?? 'Applicant');

  // Ẩn navbar cho forgot-password HR để full màn hình như /hr/login
  get isHrForgotPassword(): boolean {
    const child = this.route.firstChild;
    if (!child) return false;
    const scope = child.snapshot.queryParamMap.get('scope');
    return scope === 'hr';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/careers']); // Logout xong đẩy về trang Careers cho sạch
  }
}
