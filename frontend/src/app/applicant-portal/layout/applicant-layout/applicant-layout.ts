import { Component, inject, OnInit } from '@angular/core';
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
export class ApplicantLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  userName: string = 'Applicant';
  isLoggedIn: boolean = false;

  ngOnInit() {
    // Khôi phục logic check đăng nhập thật từ AuthService
    this.isLoggedIn = this.auth.isLoggedIn() && this.auth.isApplicant();

    if (this.isLoggedIn) {
      this.userName = localStorage.getItem('userFullName') || 'Applicant';
    }
  }

  logout() {
    localStorage.removeItem('userFullName');

    if (typeof this.auth.logout === 'function') {
      this.auth.logout();
    } else {
      localStorage.removeItem('token');
    }

    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
