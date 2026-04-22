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
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Model to bind registration form data
  form = {
    fullName: '',
    email: '',
    password: '',
    phone: ''
  };

  isLoading = false;
  errorMessage = '';

  /**
   * Submit registration data to the server via AuthService
   */
  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.auth.register(this.form).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Notify user and redirect to login for email verification
        alert('Registration successful! Please check your email to verify your account.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
