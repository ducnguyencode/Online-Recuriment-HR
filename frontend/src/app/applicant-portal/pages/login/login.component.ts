import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

export enum UserRoleLogin { APPLICANT = 'APPLICANT', HR = 'HR' }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  UserRoleLogin = UserRoleLogin;
  selectedRole = UserRoleLogin.APPLICANT;

  form = { email: '', password: '' };
  isLoading = false;
  showPassword = signal(false);

  // Các biến cho 2FA (Đội ông đã làm)
  currentStep = 'LOGIN';
  mockQrUrl = 'assets/qr-mock.png';
  twoFactorCode = '';

  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  submit() {
    if (!this.form.email || !this.form.password) {
      this.toast.error('Please enter email and password.');
      return;
    }
    this.isLoading = true;
    this.authService.login(this.form).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // Nếu API team ông bắt 2FA thì gán currentStep = 'SETUP_2FA', nếu không thì vô thẳng:
        this.toast.success('Logged in successfully!');
        this.router.navigate(['/careers']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.toast.error(err.error?.message || 'Invalid credentials.');
      }
    });
  }

  submit2FA() {
    this.isLoading = true;
    // API Call 2FA...
    setTimeout(() => {
      this.isLoading = false;
      this.toast.success('2FA Verified successfully!');
      this.router.navigate(['/careers']);
    }, 1000);
  }
}
