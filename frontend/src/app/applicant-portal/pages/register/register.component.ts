import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  registerForm = { fullName: '', email: '', password: '' };
  isLoading = signal(false);
  showPassword = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  onSubmit() {
    if (!this.registerForm.fullName || !this.registerForm.email || !this.registerForm.password) {
      this.toast.error('Please fill in all fields.');
      return;
    }
    this.isLoading.set(true);
    this.authService.register(this.registerForm).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('Account created successfully! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Registration failed.');
      }
    });
  }
}
