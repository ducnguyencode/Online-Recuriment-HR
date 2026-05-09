import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/careers']);
    }
  }

  // Model to bind registration form data
  form = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  isLoading = false;
  isRegistered = false;
  showPassword = false;
  showConfirmPassword = false;
  submittedEmail = '';
  successMessage = '';
  errorMessage = '';
  resendLoading = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Submit registration data to the server via AuthService
   */
  onSubmit() {
    if (this.isRegistered) return;

    // Frontend validation
    if (!this.form.fullName.trim() || !this.form.email.trim() || !this.form.phone.trim() || !this.form.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    // Vietnamese phone: 10 digits, starts with 0
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(this.form.phone.trim())) {
      this.errorMessage = 'Phone number must be 10 digits starting with 0 (e.g. 0981902222).';
      return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(this.form.password)) {
      this.errorMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Strip confirmPassword before sending — backend DTO forbids unknown properties
    this.auth
      .register({
        fullName: this.form.fullName.trim(),
        email: this.form.email.trim().toLowerCase(),
        phone: this.form.phone.trim(),
        password: this.form.password,
      })
      .subscribe({
      next: () => {
        this.isLoading = false;
        this.isRegistered = true;
        this.submittedEmail = this.form.email.trim().toLowerCase();
        this.successMessage =
          'Registration successful. Please check your email to verify your account.';
      },
      error: (err) => {
        this.isLoading = false;
        const backendMessage = err?.error?.message || '';
        if (
          typeof backendMessage === 'string' &&
          backendMessage.toLowerCase().includes('already registered')
        ) {
          this.errorMessage = 'Please verify your email first';
          this.submittedEmail = this.form.email.trim().toLowerCase();
        } else if (
          typeof backendMessage === 'string' &&
          backendMessage.toLowerCase().includes('account already exist')
        ) {
          this.errorMessage = 'Email already exist';
        } else {
          this.errorMessage = backendMessage || 'Registration failed. Please try again.';
        }
      },
      });
  }

  resendVerification() {
    const email = this.submittedEmail || this.form.email.trim().toLowerCase();
    if (!email || this.resendLoading) return;
    this.resendLoading = true;
    this.auth.resendVerify(email).subscribe({
      next: (res) => {
        this.resendLoading = false;
        this.toast.success(
          res.message || 'Verification email sent. Please check your inbox.',
        );
      },
      error: (err) => {
        this.resendLoading = false;
        this.toast.error(
          err?.error?.message || 'Unable to resend verification email.',
        );
      },
    });
  }

  returnLogin() {
    this.router.navigate(['/login'], { queryParams: { registered: '1' } });
  }
}
