import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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

  // Lắng nghe trạng thái login thật
  isLoggedIn = computed(() => !!this.authService.currentUser());

  // Lấy tên từ AuthService
  userName = computed(() => this.authService.currentUser()?.fullName ?? 'Applicant');

  logout() {
    this.authService.logout();
    this.router.navigate(['/careers']); // Logout xong đẩy về trang Careers cho sạch
  }
}
