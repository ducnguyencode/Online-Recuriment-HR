import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-applicant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applicant-layout.html',
  styleUrls: ['./applicant-layout.scss'], // Giữ nguyên file style của ông
})
export class ApplicantLayoutComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  // Lấy thẳng trạng thái từ AuthService (chuẩn Signal, không xài LocalStorage)
  isLoggedIn = this.auth.isLoggedIn;

  // Trỏ thẳng vào tên user hiện tại
  userName = () => this.auth.currentUser()?.fullName || 'Applicant';

  logout() {
    this.auth.logout(); // Service lo việc xóa token
    this.router.navigate(['/login']); // Chỉ cần điều hướng về trang Login
  }
}
