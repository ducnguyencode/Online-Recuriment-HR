import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-applicant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applicant-layout.html',
  styleUrls: ['./applicant-layout.scss']
})
export class ApplicantLayoutComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  // Sử dụng computed để tự động cập nhật giao diện khi Signal của AuthService thay đổi
  isLoggedIn = computed(() => this.auth.isLoggedIn() && this.auth.isApplicant());

  userName = computed(() => {
    const user = this.auth.currentUser();
    return user?.fullName || 'Applicant';
  });

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
