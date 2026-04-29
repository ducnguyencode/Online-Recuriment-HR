import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = signal(false);

  private authService = inject(AuthService);
  private toast = inject(ToastService);

  onSubmit() {
    if (!this.email) {
      this.toast.error('Please enter your email.');
      return;
    }
    this.isLoading.set(true);
    // Thay đổi method API cho đúng với service team ông nha
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('Reset link sent to your email!');
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Failed to send reset link.');
      }
    });
  }
}
