import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="login-page">
      <section class="login-card">
        <header class="login-header">
          <h1>Đăng nhập hệ thống tuyển dụng</h1>
          <p>Sử dụng tài khoản đã được cấp để tiếp tục.</p>
        </header>

        <form class="login-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input id="email" class="form-input" type="email" formControlName="email" placeholder="example@company.com" />
            @if (emailControl.touched && emailControl.invalid) {
              <p class="field-error">Email không hợp lệ.</p>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Mật khẩu</label>
            <input id="password" class="form-input" type="password" formControlName="password" placeholder="Nhập mật khẩu" />
            @if (passwordControl.touched && passwordControl.invalid) {
              <p class="field-error">Mật khẩu phải từ 6 ký tự.</p>
            }
          </div>

          @if (errorMessage()) {
            <p class="form-error">{{ errorMessage() }}</p>
          }

          <button type="submit" class="btn-primary submit-btn" [disabled]="isSubmitting() || form.invalid">
            {{ isSubmitting() ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: linear-gradient(160deg, #eff6ff 0%, #f8fafc 45%, #ffffff 100%);
    }

    .login-card {
      width: min(100%, 420px);
      padding: 28px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
    }

    .login-header h1 {
      margin: 0;
      font-size: 1.35rem;
      line-height: 1.3;
      color: #0f172a;
    }

    .login-header p {
      margin: 8px 0 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .login-form {
      margin-top: 20px;
    }

    .field-error,
    .form-error {
      margin: 8px 0 0;
      color: #dc2626;
      font-size: 0.8rem;
    }

    .submit-btn {
      width: 100%;
      margin-top: 8px;
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `],
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  private readonly returnUrl = computed(() => this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl('/hr-portal');
    }
  }

  submit() {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const { email, password } = this.form.getRawValue();
    this.authService
      .login(email.trim(), password)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => this.authService.handleLoginSuccess(response, this.returnUrl()),
        error: (errorResponse: HttpErrorResponse) => {
          const message =
            (typeof errorResponse.error?.message === 'string' && errorResponse.error.message) ||
            'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.';
          this.errorMessage.set(message);
        },
      });
  }
}
