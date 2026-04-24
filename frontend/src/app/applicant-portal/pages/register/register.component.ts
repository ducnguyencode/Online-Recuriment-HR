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
  errorMessage = '';

  /**
   * Submit registration data to the server via AuthService
   */
  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.auth.register(this.form).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirect with a query flag so login page can render inline message (no popup).
        this.router.navigate(['/login'], {
          queryParams: { registered: '1' },
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message || 'Registration failed. Please try again.';
      },
    });
  }
}
