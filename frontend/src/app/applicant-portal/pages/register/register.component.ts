import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  formError = '';

  // 1. Thêm trường 'phone' vào group để hết lỗi TS2345
  registerForm = this.fb.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]], // Thêm phone ở đây
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      this.formError = 'Vui lòng kiểm tra lại thông tin nhập liệu.';
      return;
    }

    this.isLoading = true;
    this.formError = '';

    // 2. Ép kiểu 'as any' để bypass qua cái Partial của Reactive Form
    const signUpData = this.registerForm.value as any;

    this.authService.register(signUpData).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Điều hướng sang trang verify kèm thông tin email
        this.router.navigate(['/verify-email'], {
          queryParams: { email: signUpData.email, registered: 'true' }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.formError = err.error?.message || 'Đăng ký thất bại, vui lòng thử lại.';
      }
    });
  }
}
