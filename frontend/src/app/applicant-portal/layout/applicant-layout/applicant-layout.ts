import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-applicant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applicant-layout.html',
  styleUrls: ['./applicant-layout.scss']
})
export class ApplicantLayoutComponent implements OnInit {
  isLoggedIn = false;
  userFullName = '';

  private router = inject(Router);

  ngOnInit() {
    this.updateAuthStatus();
  }

  updateAuthStatus() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.isLoggedIn = true;
        this.userFullName = user.fullName || 'Applicant User';
      } catch (e) {
        this.isLoggedIn = false;
      }
    }
  }

  onLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
