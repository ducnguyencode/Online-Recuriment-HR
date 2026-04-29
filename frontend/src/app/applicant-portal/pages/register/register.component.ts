import { Component, inject } from '@angular/core';
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
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Model to bind registration form data
  form = {
    fullName: '',
    email: '',
    password: '',
  };

  isLoading = false;
  isRegistered = false;
  submittedEmail = '';
  successMessage = '';
  errorMessage = '';

  /**
   * Submit registration data to the server via AuthService
   */
  onSubmit() {
    if (this.isRegistered) return;

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
