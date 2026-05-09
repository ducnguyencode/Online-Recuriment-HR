import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';


@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnDestroy {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;


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
  private resetRedirectTimer: ReturnType<typeof setTimeout> | null = null;
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
        this.successMessage = res.message || 'Reset link has been sent.';
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
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.isResetDone = true;
        this.successMessage = 'Password reset successfully';
        this.resetRedirectTimer = setTimeout(() => {
          this.router.navigate(['/login']);
          this.resetRedirectTimer = null;
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message ?? 'Unable to reset password. Please try again.';
      },
    });
  }

  private startAutoRedirect() {
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
    this.redirectTimer = setTimeout(() => this.returnLogin(), 3000);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  returnLogin() {
    if (this.resetRedirectTimer) {
      clearTimeout(this.resetRedirectTimer);
      this.resetRedirectTimer = null;
    }
    this.router.navigate([this.isHrScope ? '/hr/login' : '/login']);
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
  }
}
