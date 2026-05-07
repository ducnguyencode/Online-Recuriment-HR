import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const passwordStrengthValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value ?? '';
  if (!value) return null;
  return PASSWORD_RULE.test(value) ? null : { weakPassword: true };
};

const matchValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const newPass = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!newPass || !confirm) return null;
  return newPass === confirm ? null : { mismatch: true };
};

@Component({
  selector: 'app-set-initial-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './set-initial-password.component.html',
  styleUrl: './set-initial-password.component.scss',
})
export class SetInitialPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  inviteToken = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  inviteEmail = signal(this.route.snapshot.queryParamMap.get('email') ?? '');

  submitting = signal(false);
  serverError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  hasInviteToken = computed(() => !!this.inviteToken());

  form = this.fb.group(
    {
      newPassword: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchValidator },
  );

  strength = computed(() => {
    const value = this.form.get('newPassword')?.value ?? '';
    if (!value) return { label: '', score: 0 };
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    if (value.length >= 12) score++;
    const label =
      score <= 2
        ? 'Weak'
        : score === 3
          ? 'Medium'
          : score === 4
            ? 'Strong'
            : 'Very strong';
    return { label, score };
  });

  newPasswordErrors() {
    const control = this.form.get('newPassword');
    if (!control?.touched && !control?.dirty) return null;
    if (control?.hasError('required')) return 'New password is required.';
    if (control?.hasError('weakPassword')) {
      return 'Password must be at least 8 characters and include uppercase, digit and special character.';
    }
    return null;
  }

  confirmPasswordErrors() {
    const control = this.form.get('confirmPassword');
    if (!control?.touched && !control?.dirty) return null;
    if (control?.hasError('required')) return 'Please confirm your password.';
    if (this.form.hasError('mismatch')) return 'Passwords do not match.';
    return null;
  }

  submit() {
    this.serverError.set(null);
    this.successMessage.set(null);

    if (!this.hasInviteToken()) {
      this.serverError.set(
        'This invite link is missing or invalid. Please ask the administrator to resend it.',
      );
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword } = this.form.getRawValue();
    this.submitting.set(true);

    this.auth
      .setInitialPassword({
        token: this.inviteToken(),
        newPassword: newPassword!,
      })
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Your password has been set. You can now sign in with the new password.',
          );
          this.submitting.set(false);
          setTimeout(() => this.router.navigate(['/login']), 800);
        },
        error: (err) => {
          this.submitting.set(false);
          this.serverError.set(
            err?.error?.message ??
              'Unable to set the initial password. Please try again.',
          );
        },
      });
  }

  returnLogin() {
    this.router.navigate(['/login']);
  }
}
