import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

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
    if (!this.form.fullName.trim() || !this.form.email.trim() || !this.form.password) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (this.form.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.register(this.form).subscribe({
      next: () => {
        this.isLoading = false;
        this.isRegistered = true;
        this.submittedEmail = this.form.email.trim();
        this.successMessage =
          'Registration successful. Please check your email to verify your account.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message || 'Registration failed. Please try again.';
      },
    });
  }

  returnLogin() {
    this.router.navigate(['/login'], { queryParams: { registered: '1' } });
  }
}
