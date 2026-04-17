import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-applicant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applicant-layout.html',
  styleUrls: ['./applicant-layout.scss']
})
export class ApplicantLayoutComponent {
  isLogin = true;

  mockUser = {
    fullName: 'Nguyen Khang'
  };

  constructor(private router: Router) {}

  logout() {
    this.isLogin = false;
    this.router.navigate(['/careers']);
  }
}
