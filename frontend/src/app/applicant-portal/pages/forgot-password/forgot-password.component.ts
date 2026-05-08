import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  email = '';
  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  scope = this.route.snapshot.queryParamMap.get('scope') ?? '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  isSent = false;
  isResetDone = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  currentYear = new Date().getFullYear();

  get isResetMode() {
    return !!this.token;
  }

  get isHrScope() {
    return this.scope === 'hr';
  }

  sendResetLink() {
    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.auth
      .forgotPassword(this.email.trim(), this.isHrScope ? 'hr' : undefined)
      .subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isSent = true;
        this.successMessage = res.message;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message ?? 'Unable to send reset link. Please try again.';
      },
    });
  }

  submitResetPassword() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Password must have at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Confirm password does not match.';
      return;
    }

    this.isLoading = true;
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isResetDone = true;
        this.successMessage = res.message;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message ?? 'Unable to reset password. Please try again.';
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  returnLogin() {
    this.router.navigate([this.isHrScope ? '/hr/login' : '/login']);
  }
}
