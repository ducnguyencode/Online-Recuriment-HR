import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-page',
  imports: [FormsModule],
  templateUrl: './verify-page.component.html',
  styleUrl: './verify-page.component.scss',
})
export class VerifyPageComponent {
  readonly title = signal('Verifying your email...');
  readonly description = signal(
    'Please wait while we validate your verification token.',
  );
  readonly needsInitialPassword = signal(false);
  readonly activationToken = signal('');
  readonly formError = signal('');
  readonly submitting = signal(false);
  readonly password = signal('');

  constructor(
    private router: Router,
    route: ActivatedRoute,
    private authService: AuthService,
  ) {
    const token = route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.title.set('Verification token is missing');
      this.description.set('Open the verification link from your email again.');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (res) => {
        const nextStep = (res.data as any)?.nextStep;
        const activationToken = (res.data as any)?.token as string | undefined;
        if (nextStep === 'SET_INITIAL_PASSWORD' && activationToken) {
          this.needsInitialPassword.set(true);
          this.activationToken.set(activationToken);
          this.title.set('Email verified');
          this.description.set(
            'Set your initial password to activate your staff account.',
          );
          return;
        }
        this.title.set('Email verified');
        this.description.set(res.message);
      },
      error: (err) => {
        this.title.set('Verification failed');
        this.description.set(
          err.error?.message ?? 'The verification link is invalid.',
        );
      },
    });
  }

  submitInitialPassword() {
    this.formError.set('');
    if (this.password().trim().length < 6) {
      this.formError.set('Password must have at least 6 characters.');
      return;
    }
    this.submitting.set(true);
    this.authService
      .setInitialPassword(this.activationToken(), this.password().trim())
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.needsInitialPassword.set(false);
          this.title.set('Account activated');
          this.description.set(res.message);
        },
        error: (err) => {
          this.submitting.set(false);
          this.formError.set(
            err?.error?.message ?? 'Unable to set initial password.',
          );
        },
      });
  }

  returnLogin() {
    this.router.navigate(['/login']);
  }
}
