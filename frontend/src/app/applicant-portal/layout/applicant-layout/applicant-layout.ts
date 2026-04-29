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

  logout() {
    this.auth.logout(); // Service lo việc xóa token
  }
}
