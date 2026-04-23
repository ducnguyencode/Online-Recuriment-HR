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
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  isSent = false;
  isResetDone = false;
  errorMessage = '';
  successMessage = '';

  get isResetMode() {
    return !!this.token;
  }

  sendResetLink() {
    if (!this.email.trim()) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.auth.forgotPassword(this.email.trim()).subscribe({
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

  returnLogin() {
    this.router.navigate(['/login']);
  }
}
